'use strict';
var port = 1337;
var express = require('express');
var app = express();
var gm = require("googlemaps");
var edge = require('edge-js');
var cors = require('cors')
var map = require('google_directions');
// החלק שמסומן בהערה מתייחס על אם היינו מבצעים קריאה מקובץ json 
//var fs = require('fs'); 


//fs.readFile('./places.json', 'utf8',function (err, contents) {
//    console.log(contents);
//    try {
//        var jsonObj = JSON.parse(contents);
//        for (var i = 0; i < jsonObj.length; i++) {
 //           console.log(  jsonObj[i].street);
           
//        }
        
//    } catch (err) { console.log("error");}


   
//});


var params1 = {
    // REQUIRED
    origin: "",
    destination: "",
    key: "AIzaSyC9ou4rj0L3bn6Zq_GDRvtL8_cUxTAZQGw",
};
var publicConfig = {
    key: 'AIzaSyC9ou4rj0L3bn6Zq_GDRvtL8_cUxTAZQGw',
    stagger_time: 1000, // for elevationPath
    encode_polylines: false,
    secure: true // use https
};

var whitelist = [
    'http://localhost:4200',
];
var corsOptions = {
    origin: function (origin, callback) {
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    },
    credentials: true
};
app.use(cors(corsOptions));
var params = {
   // מכיוון שמסד הנתונים יושב על המחשב ולא מתחברים אליו דרך האינטרנט יש לשמור את מסד הנתונים על המחשב ולשנות את הערך לשם המחשב הספציפי
    connectionString: "Data Source=DESKTOP-3M12K8P;" + "Initial Catalog=my_Supermarkets_db;Integrated Security=True",
    source: "select * from stores"
};

var Min; var MinItem;

function Distance(latitude1, longitude1) {
    var latitude2 = 32.5693440;
    var longitude2 = 34.9334530;
    var R = 6371; // Radius of the earth in km
    var dLat = (latitude2 - latitude1) * Math.PI / 180;  // deg2rad below
    var dLon = (longitude2 - longitude1) * Math.PI / 180;
    var a =  0.5 - Math.cos(dLat) / 2 +
        Math.cos(latitude1 * Math.PI / 180) * Math.cos(latitude2 * Math.PI / 180) *
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}




async function connectgoogleDIrections(callback) {
  await  map.getDistance(params1, function (err, data) {
        if (err) {
            console.log(err);
           

        }

      console.log("data is :" + data);
      callback(parseFloat(data));
    });

}





async function ChooseNearestSuper(supers, latitude, longitude,callback) {
    var tempResult; Min = parseFloat(150); var counter = 0;
    params1.origin = latitude + ',' + longitude;
    for (const item of supers) {
      
        params1.destination = item.latitude + ',' + item.longitude;
        await map.getDistance(params1, function (err, data) {
            if (err) {
                console.log(err);
            
            }
            if (parseFloat(data) < Min) {
                Min = parseFloat(data);
                MinItem = item;
            }
            counter++;
           
            console.log("data is :" + data + " " + item.storename.toString() + " " + item.city.toString() + " " + item.street.toString()); console.log("min is" + Min + " km" + MinItem.city.toString() + "the counter is" + counter);
            if (counter == supers.length) {
                console.log("DONE"); callback(Min);
            }
        });
    }
    

  

      
        

    }

  
    



app.get('/', function (request, response) {
  
//var operation = request.query.action;

  //  http://localhost:1337/?latitude=32.62915520000001&longitude=34.94061450000004
    var ID = request.query.ID;
    var latitude = request.query.latitude;
    var longitude = request.query.longitude;
   // console.log(latitude + '  ' + longitude);

    var getData = edge.func('sql', params);

    getData(null, function (error, result) {
        if (error) { console.log(error); return; }
        if (result) {
            console.log(result);
            console.log(JSON.stringify(result));
            //     ChooseNearestSuper(result);
            if (latitude == undefined || latitude == null || longitude == undefined || longitude == null) { response.send('0');}

            if (latitude != undefined && latitude != null && longitude != undefined && longitude != null) {
            
            

                ChooseNearestSuper(result, latitude, longitude, function (results) {
                    console.log(results);
                    console.log(Min.toString() + " " + MinItem);
                    params1.destination = MinItem.latitude + ',' + MinItem.longitude;
                    //הוספת מדריך להגעה לסופר
                    map.getDirectionSteps(params1, function (err, steps) {
                        if (err) {
                            console.log(err);
                            return 1;
                        }

                        // parse the JSON object of steps into a string output
                        var output = "";
                        var stepCounter = 1;
                        steps.forEach(function (stepObj) {
                            var instruction = stepObj.html_instructions;
                            instruction = instruction.replace(/<[^>]*>/g, ""); // regex to remove html tags
                            var distance = stepObj.distance.text;
                            var duration = stepObj.duration.text;
                            output += "Step " + stepCounter + ": " + instruction + " (" + distance + "/" + duration + ")\n";
                            stepCounter++;
                        });
                        console.log(output);
                        var obj = { "distance": Min, "directions": output, "city": MinItem.city, "storename": MinItem.storename, "street": MinItem.street };
                        var myJSON = JSON.stringify(obj);

                        var temp2 = JSON.stringify(MinItem);
                      
                        response.send(myJSON);
                      
                    });
                   
                
               
                });
             
             
 
            
            
        }
        }
        else {
            console.log("No results");
        }
    });

    
});
app.listen(port);
console.log('Server running on port ' + port);