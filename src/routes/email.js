const express = require("express")
const router = express.Router();
const nodemailer = require("nodemailer")


router.post("/send",(req,res) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PWORD
        }
    })

    const details = {
        from: process.env.MAIL_USERNAME,
        to: "bananabarbarbarbarbara@gmail.com",
        subject: "Test",
        text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }

    transporter.sendMail(details, (err,data) => {
        if(err) {
            console.log(err)
        }else {
            console.log("sent")
        }
    })
})


module.exports = router;