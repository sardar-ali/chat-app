const mongoose = require("mongoose");

const url = "mongodb+srv://crud-app:crud-app@cluster0.d1ncvk2.mongodb.net/?retryWrites=true&w=majority";

const dbConnection = () => {
    mongoose.connect(url).then((res) => {
        console.log("Connected to db successfully")
    }).catch((err) => {
        console.log("connection failed")
    })
}

module.exports = dbConnection