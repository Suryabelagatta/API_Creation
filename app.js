const express = require("express");
const bodyParser = require("body-parser");
const { connectToDatabase, getDb } = require("./connection");
const { ObjectId } = require("mongodb"); // import ObjectId for querying by _id
const multer = require('multer');//to handle image files

const app = express();
const port = 3000;

app.use(bodyParser.json()); // Middleware to parse JSON bodies
app.use('/api/v3/app', (req, res, next) => {
    next();
  });

// connection to the database
connectToDatabase().then(() => {
  console.log("Database connection established.");
});

// set up multer storage for the uploaded files
const storage = multer.memoryStorage(); // Store in memory
const upload = multer({ storage: storage });

app.post("/api/v3/app/events", upload.single('image'), async (req, res) => {
  try {
    const db = getDb();
    const {
      name,
      tagline,
      schedule,
      description,
      moderator,
      category,
      sub_category,
      rigor_rank,
      attendees,
    } = req.body;

    // convert the uploaded image to Base64 encoded string
    let imageBase64 = '';
    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64'); // get the Base64 string from the buffer
    }

    const event = {
      type: "event",
      uid: Math.floor(Math.random() * 100), // generate a random user ID
      name,
      tagline,
      schedule: new Date(schedule),
      description,
      moderator,
      category,
      sub_category,
      rigor_rank: parseInt(rigor_rank),
      attendees: attendees || [],
      image: imageBase64,
    };

    const result = await db.collection("events").insertOne(event);

    res.status(201).send({
      message: "Event created successfully",
      eventId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      error: "Error creating event",
      details: error.message,
    });
  }
});

// Get event data
app.get("/api/v3/app/events/:id", async (req, res) => {
    try {
      const db = getDb();
      const eventId = req.params.id; // Get ID from the URL
      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) }); // Find the event by ID
    
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      event.image=`/api/v3/app/events/${eventId}/image`;
      res.status(200).json(event); // JSON with image URL
    } catch (err) {
      console.error("Error retrieving event:", err.message);
      res.status(500).json({ error: "Error retrieving event", details: err.message });
    }
  });
  
  // Get event image 
  app.get("/api/v3/app/events/:id/image", async (req, res) => {
    try {
      const db = getDb();
      const eventId = req.params.id; // Get the event ID from the URL
      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) }); // Find the event by ID
    
      if (!event || !event.image) {
        return res.status(404).json({ error: "Image not found for this event" });
      }
  
      // send image data 
      const imageBuffer = Buffer.from(event.image, 'base64');
      res.setHeader('Content-Type', 'image/png'); // set the type of the image as correct format like png
      res.status(200).send(imageBuffer); // send the image
    } catch (err) {
      console.error("Error retrieving image:", err.message);
      res.status(500).json({ error: "Error retrieving image", details: err.message });
    }
  });
  
// GET request to fetch events withpagination
app.get("/api/v3/app/events", async (req, res) => {
    try {
      const db = getDb();
      const { type, limit, page} = req.query; // reading query parameters
      if (type !== "latest") {
        return res.status(400).json({ error: "Invalid type. Only 'latest' is supported." });
      }
  
      const events = await db
        .collection("events")
        .find()
        .sort({ schedule: -1 }) // sort by recency (most recent first)
        .skip((parseInt(page) - 1) * parseInt(limit)) // skip events for pagination
        .limit(parseInt(limit)) // limit the number of results
        .toArray();
  
      // Modify each event to update 'image' to 'imageUrl' so that it is not displayed in encoded or any binary format
      const eventsWithImageUrl = events.map(event => {
        event.image=`/api/v3/app/events/${event._id}/image`;
        return {
          ...event
        };
      });
  
      res.status(200).json(eventsWithImageUrl); // return the paginated events

    } catch (err) {
      console.error("Error retrieving events:", err.message);

      res.status(500).json({ error: "Error retrieving events", details: err.message });
    }
  });
  

// PUT request to update an event by ID
app.put("/api/v3/app/events/:id", async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params; // extract the unique event ID 

        // validate the ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid event ID format" });
        }

        const {
            type,
            uid,
            name,
            tagline,
            schedule,
            description,
            moderator,
            category,
            sub_category,
            rigor_rank,
            attendees,
            image,
        } = req.body;

        // event payload
        const updatedEvent = {
            ...(type && { type }),
            ...(name && { name }),
            ...(uid && { uid: parseInt(uid) }),
            ...(tagline && { tagline }),
            ...(schedule && { schedule: new Date(schedule) }),
            ...(description && { description }),
            ...(moderator && { moderator }),
            ...(category && { category }),
            ...(sub_category && { sub_category }),
            ...(rigor_rank && { rigor_rank: parseInt(rigor_rank) }),
            ...(attendees && { attendees: Array.isArray(attendees) ? attendees : JSON.parse(attendees) }),
            ...(image && { image }),
        };

        // Update the event in the database
        const result = await db.collection("events").updateOne(
            { _id: new ObjectId(id) }, // Find the event
            { $set: updatedEvent }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event updated successfully" });
    } catch (err) {
        console.error("Error updating event:", err.message);
        res.status(500).json({ error: "Error updating event", details: err.message });
    }
});
  
app.delete("/api/v3/app/events/:id", async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params; // get the unique event ID 

        // validate the ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid event ID format" });
        }

        // delete the event 
        const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (err) {
        console.error("Error deleting event:", err.message);
        res.status(500).json({ error: "Error deleting event", details: err.message });
    }
});

//success message and url for accessing the server with the port its running
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });