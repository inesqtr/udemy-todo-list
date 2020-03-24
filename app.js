//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const dotenv = require('dotenv');

dotenv.config();


const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const url = process.env.MONGOLAB_URI;

//create database
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

//create schema
const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

//create model
const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

//create new documents
const item1 = new Item({
    name: "Welcome to your To Do List!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete and item."
});

const defaultItems = [item1, item2, item3];


//render homepage
app.get("/", function (req, res) {
    //getting items from database
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully saved default Item to DB");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    //findOne returns an object
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    })
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Succesfully deleted Item from DB");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName)
            }
        })
    }
});

//render about page
app.get("/about", function (req, res) {
    res.render("about");
});


let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
};


app.listen(port, function () {
    console.log("Server has started successfully.");
});
