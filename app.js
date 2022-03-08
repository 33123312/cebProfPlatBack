require('dotenv').config()
const cors = require('cors')

const express = require("express")
const app = express()
const CalifasUpload = require("./routes/CalifasUpload")
const CalifasModify = require("./routes/CalifasModify")
const login = require("./routes/Login.js")
const passport = require('passport');


app.use(cors({origin:process.env.WEB_APP_URL}))
app.use(express.json());

require("./auth")
app.use(login)

app.use(passport.authenticate("jwt",{session:false}))
app.use(CalifasUpload)
app.use(CalifasModify)
app.listen(process.env.APP_PORT,()=>console.log("corriendo"))

