# API_Creation
API_Creation is javascript backend project which performs basic crud operations with REST APIs 

Build all of the APIs as per the Documentation 

Took help with chatgpt to resolve some errors 
Refered youtube video to handle image files with nodejs link to the video: https://youtu.be/pfxd7L1kzio?si=u93DySOd88WeFBP9 

**Small changes in the GET API**

As the images are stored in the encodings and I was feeling hard to send json data and the image that are retrived from the database at the same time so an additional GET method is defined to get the image encodings and convert it into image format and then send only the image, during normal GET method the image field which contains the encoding is replaced with the url mapping to the image GET method.