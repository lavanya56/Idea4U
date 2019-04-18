const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const timeStamp = require('time-stamp');
const jwt = require('jsonwebtoken-refresh');
const TFARegister = require('./CloudFunctions/TFARegister');
const TFACheck = require('./CloudFunctions/TFACheck');
const MongoClient = mongodb.MongoClient;

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
var nexmoRequestId;
// TFARegister({ phoneNo: '9951818285' }).then((respData) => {
//     //console.log(respData);
//     if (respData.resData.result.status == 0) {
//         console.log("this is request Id:" + respData.resData.result.request_id)
//         nexmoRequestId = respData.resData.result.request_id;
//         //console.log('this is request ID for Nexmo: '+respData.resData.result.request_id);
//         res.send({nexmoStatus:'success'});
//         console.log('inside tfa register done setBasic User Data');
//     } else if (respData.resData.result.status == 3) {
//         console.log("invalid phone number")
//         res.send({nexmoStatus:'failure'});
//     } else if (respData.resData.result.status == 9) {
//         console.log("Your nexmo account does not have sufficient credit to process this request")
//         res.send({nexmoStatus:'failure'});
//     } else if (respData.resData.result.status == 10) {
//         console.log("Concurrent verifications to the same number are not allowed")
//         res.send({nexmoStatus:'failure'});
//     } else if (respData.resData.result.status == 15) {
//         console.log("The destination number is not in a supported network")
//         res.send({nexmoStatus:'failure'});
//     } else {
//         res.send({nexmoStatus:'failure'});
//     }
// })

MongoClient.connect("mongodb://ideahub:ideahub123@ds046027.mlab.com:46027/ideahub", (err, database) => {
    if (err) {
        console.log('connection is not established');
    }
    else {
        console.log('connection is established');
        var myDb = database.db('ideahub');
        var studentDetails = myDb.collection('studentDetails');

        //get all student details

        app.get('/getAllStudents', (req, res) => {
            studentDetails.find().toArray((err, resp) => {
                if (err) {
                    console.log('err while get student details');
                } else {
                    console.log('get all student details');
                    console.log(resp);
                    res.send(resp);
                }
            });
        })


        //get particular student detaials by phone number

        app.get('/getParticularStudent', (req, res) => {
            studentDetails.findOne({ 'mobile': '8333870037' }, (err, resp) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('filter student by mobile number');
                    console.log(resp);
                    res.send(resp);
                }
            });
        })


        // student login

        app.post('/signIn', (req, res) => {
            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { 'loggedIn': true } }, (err, resp) => {
                if (err)
                    console.log(err);
                else {
                    console.log('successfully loggedin');
                    res.send({ loggedIn: true });
                }
            });
        })


        // student logout

        app.post('/signOut', (req, res) => {
            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { 'loggedIn': false } }, (err, resp) => {
                if (err)
                    console.log(err);
                else {
                    console.log('successfully logged out');
                    res.send({ loggedIn: false });
                }
            });
        })


        //post new idea to a student by phone number

        app.post('/postNewIdea', (req, res) => {
            var idea = {
                "id": Math.floor(Math.random() * 1000000),
                "name": 'inserting new idea',
                "description": "sample description",
                "requirement": "Need iot components",
                "teamMembers": ["12A51A04D1"],
                "costEstimation": "10000",
                "estimatedTime": "10",
                "ideaStatus": "Not Started",
                "progressText": []
            }
            studentDetails.updateOne({ 'mobile': '9951818285' }, { $push: { ideas: idea } }, (err, resp) => {
                if (err) {
                    console.log(err);
                    res.send({ postStatus: 'failure' });
                } else {
                    console.log('inserting new idea to user');
                    res.send({ postStatus: 'success' });
                }
            });
        });


        //requesting to join an idea by phone number and idea id
        //phone1, phone2, idea id1, idea id2

        app.post('/requestForIdea', (req, res) => {
            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { 'requested': true, 'confirmed': false } }, (err, resp) => {
                if (err)
                    res.send({ requestStatus: 'failure' });
                else {
                    console.log('requesting for an idea');
                    studentDetails.findOne({ 'mobile': '8333870037' }, (err, resp) => {
                        if (err)
                            res.send({ requestStatus: 'failure' });
                        else {
                            console.log('adding requesting id to idea');
                            resp.ideas.forEach(element => {
                                if (element.id == '10002') {
                                    element.teamMembers.push('12A51A04D1');
                                    studentDetails.update({ 'mobile': '8333870037' }, { $set: { ideas: resp.ideas } }, (err, resp) => {
                                        if (err)
                                            res.send({ requestStatus: 'failure' });
                                        else {
                                            console.log('updated the team member into idea');
                                            res.send({ requestStatus: 'success' });
                                        }
                                    })
                                }
                            });
                        }
                    })
                }
            });
        })


        //rejecting student from an idea by phone number and idea id
        //phone1, phone2, idea id1, idea id2
        app.post('/deleteStudentFromId', (req, res) => {

            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { 'requested': false, 'confirmed': false } }, (err, resp) => {
                if (err)
                    res.send({ requestStatus: 'failure' });
                else {
                    console.log('deleting student from idea');
                    studentDetails.findOne({ 'mobile': '8333870037' }, (err, resp) => {
                        if (err)
                            res.send({ requestStatus: 'failure' });
                        else {
                            console.log('deleting requesting id from idea');
                            resp.ideas.forEach(element => {
                                if (element.id == '10002') {
                                    element.teamMembers.splice(element.teamMembers.indexOf('12A51A04D1'), 1);
                                    studentDetails.update({ 'mobile': '8333870037' }, { $set: { ideas: resp.ideas } }, (err, resp) => {
                                        if (err)
                                            res.send({ requestStatus: 'failure' });
                                        else {
                                            res.send({ requestStatus: 'success' });
                                        }
                                    })
                                }
                            });
                        }
                    })
                }
            });
        })


        //confirming the student to an idea

        app.post('/confirmStudent', (req, res) => {
            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { 'requested': true, 'confirmed': true } }, (err, resp) => {
                if (err)
                    res.send({ requestStatus: 'failure' });
                else {
                    console.log('confirmed the student to the idea');
                    res.send({ requestStatus: 'success' });
                }
            });
        })

        //start idea from not started

        app.post('/startIdea', (req, res) => {
            studentDetails.findOne({ 'mobile': '9951818285' }, (err, resp) => {
                if (err)
                    res.send({ ideaStatus: 'Not Started' });
                else {
                    resp.ideas.forEach(element => {
                        if (element.id == '10001') {
                            element.ideaStatus = "Started";
                            studentDetails.update({ 'mobile': '9951818285' }, { $set: { ideas: resp.ideas } }, (err, resp) => {
                                if (err)
                                    res.send({ ideaStatus: 'Not Started' });
                                else {
                                    console.log('updated the idea status to started');
                                    res.send({ ideaStatus: 'Started' });
                                }
                            })
                        }
                    })
                }
            })
        });

        //idea state to complete

        app.post('/completeIdea', (req, res) => {
            studentDetails.findOne({ 'mobile': '9951818285' }, (err, resp) => {
                if (err)
                    res.send({ ideaStatus: 'Started' });
                else {
                    resp.ideas.forEach(element => {
                        if (element.id == '10001') {
                            element.ideaStatus = "Completed";
                            studentDetails.update({ 'mobile': '9951818285' }, { $set: { ideas: resp.ideas } }, (err, resp) => {
                                if (err)
                                    res.send({ ideaStatus: 'Started' });
                                else {
                                    console.log('updated the idea status to completed');
                                    res.send({ ideaStatus: 'Completed' });
                                }
                            })
                        }
                    })
                }
            })
        });


        // updating idea progress

        app.post('/ideaProgress', (req, res) => {
            studentDetails.findOne({ 'mobile': '9951818285' }, (err, resp) => {
                if (err)
                    res.send({ progressStatus: 'failure' });
                else {
                    resp.ideas.forEach(element => {
                        if (element.id = '10001') {
                            var progressText = {
                                "createdBy": "Ramprakash Seepana",
                                "date": timeStamp('YYYY/MM/DD'),
                                "description": "updated successfully",
                                "percentageCompleted": "10"
                            }
                            element.progressText.push(progressText);
                            studentDetails.updateOne({ 'mobile': '9951818285' }, { $set: { ideas: resp.ideas } }, (err, resp) => {
                                if (err)
                                    res.send({ progressStatus: 'failure' });
                                else {
                                    console.log('updated the progress bar successfully');
                                    res.send({ progressStatus: 'success' });
                                }
                            })
                        }
                    })
                }
            })
        })




    }
});


app.listen(4000, () => {
    console.log('application is running at port: 4000');
})