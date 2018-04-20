var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();

var mongodb = require('mongodb'),
    mongoClient = mongodb.MongoClient,
    ObjectID = mongodb.ObjectID, // Used in API endpoints
    db; // We'll initialize connection below

app.use(bodyParser.json());
app.set('port', process.env.PORT || 8080);
app.use(cors()); // CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.use(express.static("www")); // Our Ionic app build is in the www folder (kept up-to-date by the Ionic CLI using 'ionic serve')

/*
 *  If you are running locally you can reference your MongoDB instance in Heroku by adding the following"
 *
 *     var MONGODB_URI = process.env.MONGODB_URI || <your_mongodb_url>;
 *
 *  The way to get the mongodb URL is with the following command, after you create the Heroku instance:
 *
 *     heroku config | grep MONGODB_URI
 *
*/

var MONGODB_URI = process.env.MONGODB_URI; // || <your_mongodb_url>;

// Initialize database connection and then start the server.
mongoClient.connect(MONGODB_URI, function (err, database) {
  if (err) {
    process.exit(1);
  }

  db = database; // Our database object from mLab

  console.log("Database connection ready");

  // Initialize the app.
  app.listen(app.get('port'), function () {
    console.log("You're a wizard, Harry. I'm a what? Yes, a wizard, on port", app.get('port'));
  });
});

function alexaResponse(str, sessionId) {
return {
    "version": "string",
    "sessionAttributes": {
        "key": sessionId
    },
    "response": {
            "outputSpeech": {
            "type": "PlainText",
            "text": str,
            "ssml": `<speak>${str}</speak>`
        },
        "shouldEndSession": true
    }
  }
}

function listOptionsRespTemplate(showList) {
   return `here's whats on tv: ${showList}`;
}

function listItemsRespTemplate(watchList) {
  return `here's whats on your watch list: ${watchList}`;
}

function addItemRespTemplate(showName) {
  return `ok, I've added ${showName}, to your watch list`;
}

// Alexa endpoints
app.post("/api/alexa", function (req, res) {
  var sessionId = req.body.session.sessionId;

  switch (req.body.request.intent.name) {
      case "ListOptions":
        db.collection("tvShows").find({}).toArray(function (err, docs) {

          if (err) {
            handleError(res, err.message, "Failed to get shows");
          } else {
            var showList = "";
            console.log("DOCS: " + docs);
            docs.forEach(item => {
                console.log("DOC: " + JSON.stringify(item));
                showList += `${item.tvShow}, `;
            });

            var responseObject = alexaResponse(listOptionsRespTemplate(showList), sessionId);

            res.status(200).json(responseObject);
          }
        });
        return;
    case "ListItems":
        db.collection("watchList").find({}).toArray(function (err, docs) {
          if (err) {
            handleError(res, err.message, "Failed to get todos");
          } else {
            var watchList = "";
            console.log("DOCS: " + JSON.stringify(docs));
            docs.forEach(item => {
                console.log("DOC: " + JSON.stringify(item));
                watchList += `${item.tvShow}, `;
            });
            var responseObject = alexaResponse(listItemsRespTemplate(watchList), sessionId);
            res.status(200).json(responseObject);
          }
        });

        return;
      case "AddItem":
        snowName = req.body.request.intent.slots.tv_show.value;

        var newTvShow = {
            tvShow: snowName
        }

        db.collection("watchList").insertOne(newTvShow, function (err, doc) {

          if (err) {
            handleError(res, err.message, "Failed to add todo");
          } else {
            var responseObject = alexaResponse(addItemRespTemplate(doc.ops[0].tvShow), sessionId);
            res.status(200).json(responseObject);
          }
        });

      return;

  }
});

/*
 *  Endpoint for populating the "TV guide" with some options. Just post the following to http://<your_app_name>.herokuapp.com/api/tvshow
 *
 *     {
 *       "tvShow": "Legion"
 *     }
 *
*/
app.post("/api/tvshow", function (req, res) {
  var newTvShow = { tvShow: req.body.tvShow }

  db.collection("tvShows").insertOne(newTvShow, function (err, doc) {

    if (err) {
      handleError(res, err.message, "Failed to add TV Show");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*
 *  Endpoint --> "/api/todos"
 *
 *  To change the todo app to the "TV guide" you can update the collection lookup from "todo" to "tvShows" 
 */

// GET: retrieve all todos
app.get("/api/todos", function(req, res) {
  db.collection("todos").find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get todos");
    } else {
      res.status(200).json(docs);
    }
  });
});

// POST: create a new todo
app.post("/api/todos", function(req, res) {
  var newTodo = {
    description: req.body.description,
    isComplete: false
  }

  db.collection("todos").insertOne(newTodo, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to add todo");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});


/*
 *  Endpoint "/api/todos/:id"
 */

// GET: retrieve a todo by id -- Note, not used on front-end
app.get("/api/todos/:id", function(req, res) {
  db.collection("todos").findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get todo by _id");
    } else {
      res.status(200).json(doc);
    }
  });
});

// PUT: update a todo by id
app.put("/api/todos/:id", function(req, res) {
  var updateTodo = req.body;
  delete updateTodo._id;

  db.collection("todos").updateOne({_id: new ObjectID(req.params.id)}, updateTodo, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update todo");
    } else {
      res.status(204).end();
    }
  });
});

// DELETE: delete a todo by id
app.delete("/api/todos/:id", function(req, res) {
  db.collection("todos").deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete todo");
    } else {
      res.status(204).end();
    }
  });
});

// Error handler for the api
function handleError(res, reason, message, code) {
  console.log("API Error: " + reason);
  res.status(code || 500).json({"Error": message});
}
