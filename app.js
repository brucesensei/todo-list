//jshint esversion:6
// require all necessary packages

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://brucesensei:fpJjbUhrIYdsv85H@cluster0.z7rplrk.mongodb.net/todolistDB", {useNewUrlParser: true});

// create an Item schema for the database

const itemsSchema = {
  name: String
};

// create a List schema for the database

const listSchema = {
  name: String,
  items: [itemsSchema]
};

// create a model called List and pass it the schema for the database

const List = mongoose.model("List", listSchema);

// create a model called Item and pass it the schema for the database
//                       ====

const Item = mongoose.model("Item", itemsSchema);

// create documents to add to Item

const item1 = new Item({
  name : "Welcome to your todo list!"
});

const item2 = new Item({
  name : "Hit the + button to create a new item."
});

const item3 = new Item({
  name : "Check the box to delete an item."
});

// put the created docuemnts into an array for insertion

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {
  // use the find method to check for entries in the database
  // foundItems is declared as the name of the arry holding the items in the DB
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      // insert the documents into the Item database
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("successfully saved default items to the database");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// create dynamic routes based on user input

app.get("/:customListName", function(req, res){
  const customListName =  _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // create a new list if no list found
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        // save name as that which the user provides. insert default items from orriginal list.
        // create a new route and direct the user to it
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

});

// save new todo item and redirect either to the home route or to a custom route
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

// handle item deletion request. remove item from database and redirect to the home route
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Item has been removed from the database.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList){
        if (!err){
          res.redirect("/" + listName)
        }
      }
    )
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
