const mongoose = require("mongoose");
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
