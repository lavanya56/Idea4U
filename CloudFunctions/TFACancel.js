  
  module.exports=  (params)=> {
    const Nexmo= require('nexmo');
    const nexmo = new Nexmo({
      apiKey: process.env.Nexmo_Key,
      apiSecret: process.env.Nexmo_password
      });
      return new Promise(function(resolve,reject){
        nexmo.verify.control({request_id:params.requestId,cmd:'cancel'},(err, result) => {
          console.log('inside the nexmo');
          if(err) {
            console.log(err)
            reject ({'this is an error:':err});
          } else {
            console.log(result)
            if(result.status == '0') {
              resolve({resData:"Done"}); // Success! Now, have your user enter the PIN
            }else {
              resolve({resData:'Done'});
            }
          }
        });
      })
   
//    return {values:params.phoneNumber}
  };