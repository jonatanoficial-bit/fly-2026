window.DEFAULT_AIRCRAFT_CATALOG = [
 {modelId:"NARROW_GENERIC",name:"Jato Narrow",category:"Narrow",seats:180,rangeKm:5200,cruiseKts:440,fuelBurnPerKm:2.2,price:450000000,imageRef:"assets/aircraft/narrow.png"},
 {modelId:"WIDE_GENERIC",name:"Jato Wide",category:"Wide",seats:300,rangeKm:9000,cruiseKts:480,fuelBurnPerKm:4.5,price:950000000,imageRef:"assets/aircraft/wide.png"},
 {modelId:"JUMBO_GENERIC",name:"Jato Jumbo",category:"Jumbo",seats:420,rangeKm:12000,cruiseKts:500,fuelBurnPerKm:6.8,price:1600000000,imageRef:"assets/aircraft/jumbo.png"},
 {modelId:"REGIONAL_GENERIC",name:"Regional Jet",category:"Regional",seats:90,rangeKm:2800,cruiseKts:380,fuelBurnPerKm:1.4,price:180000000,imageRef:"assets/aircraft/regional.png"},
 {modelId:"TURBOPROP_GENERIC",name:"Turboélice",category:"Turboprop",seats:70,rangeKm:2200,cruiseKts:300,fuelBurnPerKm:1.1,price:120000000,imageRef:"assets/aircraft/turboprop.png"}
];

window.flightData = {
 company:{cash:250000000,reputation01:0.55,day:1,minuteOfDay:480,fuelPricePerUnit:5.2,season:"NORMAL"},
 airports:[
  {code:"GRU",name:"São Paulo",lat:-23.43,lon:-46.47,demandBase:0.9,hubLevel:5},
  {code:"GIG",name:"Rio",lat:-22.8,lon:-43.25,demandBase:0.85,hubLevel:5},
  {code:"JFK",name:"New York",lat:40.64,lon:-73.78,demandBase:0.92,hubLevel:5},
  {code:"LHR",name:"London",lat:51.47,lon:-0.45,demandBase:0.93,hubLevel:5}
 ],
 routes:[],
 flights:[],
 fleet:[{id:"AC1",modelId:"REGIONAL_GENERIC",condition01:0.95,status:"ACTIVE"}],
 staff:[],
 ledger:[],
 __ids:{flight:1000,route:100,fleet:1,staff:10}
};
