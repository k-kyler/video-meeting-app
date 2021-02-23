const mongoose = require("mongoose");

mongoose.connect(
    "mongodb+srv://webrtc-user_005:adminwebrtc123456@cluster0.kopin.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    }
);

const Schema = mongoose.Schema;

const AccountSchema = new Schema(
    {
        username: String,
        password: String,
    },
    {
        collection: "user",
    }
);

const AccountModel = mongoose.model("user", AccountSchema);

module.exports = AccountModel;
