import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://todo:todo123@cluster0.8g2jntv.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the todo app",
});

const item2 = new Item({
  name: "Welcome to the todo app 2",
});

const item3 = new Item({
  name: "Welcome to the todo app 3",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, foundItem) => {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved!");
        }
        res.redirect("/");
      });
    } else {
      res.render("index", {
        listTitle: "Today",
        newListItems: foundItem.reverse(),
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName }, (err, found) => {
    if (!err) {
      if (!found) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("index", {
          listTitle: found.name,
          newListItems: found.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save((err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (!err) {
        if (foundList) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedBox = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedBox, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedBox } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(3000, () => {
  console.log("App is running on port 3000");
});
