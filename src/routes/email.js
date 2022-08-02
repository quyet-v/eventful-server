const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const moment = require("moment");


router.post("/send",(req,res) => {

    const date = req.body.data.date;   
    const time = req.body.data.time
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PWORD
        }
    })

    const details = {
        from: process.env.MAIL_USERNAME,
        to: "chickendoodjk@gmail.com",
        subject: "reeee",
        text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }

    
    
    const timeSplitted = time.split(":");
    const hour = timeSplitted[0];
    const mins = timeSplitted[1];
    const newDate = moment(date).add(hour,"h").add(mins,"m").toDate();
    const alertDate = moment(newDate).subtract(12,"h");

    console.log(alertDate.toDate());
    console.log(new Date());
    schedule.scheduleJob(alertDate.toDate(), () => {
        transporter.sendMail(details, (err,data) => {
            if(err) {
                console.log(err)
            }else {
                console.log("sent")
            }
        })
    })
})



module.exports = router;