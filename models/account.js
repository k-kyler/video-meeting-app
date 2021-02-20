const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/webrtc", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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
