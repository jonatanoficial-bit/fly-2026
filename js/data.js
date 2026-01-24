// js/data.js — Offline-first (sem Firebase) + núcleo de simulação
(function(){
  const LS_KEY = "flysim_save_v1";
  const DLC_KEY = "flysim_dlc_v1";

  function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

  const DEFAULT_STATE = {"meta": {"version": 1, "createdAt": 1769265795}, "time": {"day": 1, "minuteOfDay": 480}, "company": {"name": "Nova Airways", "cash": 12000000, "reputation": 0.55, "co2Credits": 800}, "ledger": [], "airports": [{"code": "GRU", "city": "São Paulo", "lat": -23.4356, "lon": -46.4731, "country": "BR"}, {"code": "GIG", "city": "Rio de Janeiro", "lat": -22.809, "lon": -43.2506, "country": "BR"}, {"code": "BSB", "city": "Brasília", "lat": -15.8711, "lon": -47.9186, "country": "BR"}, {"code": "SSA", "city": "Salvador", "lat": -12.9086, "lon": -38.3225, "country": "BR"}, {"code": "POA", "city": "Porto Alegre", "lat": -29.994, "lon": -51.1715, "country": "BR"}, {"code": "LHR", "city": "London", "lat": 51.47, "lon": -0.4543, "country": "UK"}, {"code": "CDG", "city": "Paris", "lat": 49.0097, "lon": 2.5479, "country": "FR"}, {"code": "FRA", "city": "Frankfurt", "lat": 50.0379, "lon": 8.5622, "country": "DE"}, {"code": "MAD", "city": "Madrid", "lat": 40.4893, "lon": -3.5676, "country": "ES"}, {"code": "JFK", "city": "New York", "lat": 40.6413, "lon": -73.7781, "country": "US"}, {"code": "LAX", "city": "Los Angeles", "lat": 33.9416, "lon": -118.4085, "country": "US"}, {"code": "ORD", "city": "Chicago", "lat": 41.9742, "lon": -87.9073, "country": "US"}, {"code": "DFW", "city": "Dallas", "lat": 32.8998, "lon": -97.0403, "country": "US"}, {"code": "MIA", "city": "Miami", "lat": 25.7959, "lon": -80.287, "country": "US"}, {"code": "YYZ", "city": "Toronto", "lat": 43.6777, "lon": -79.6248, "country": "CA"}, {"code": "MEX", "city": "Mexico City", "lat": 19.4361, "lon": -99.0719, "country": "MX"}, {"code": "EZE", "city": "Buenos Aires", "lat": -34.8222, "lon": -58.5358, "country": "AR"}, {"code": "SCL", "city": "Santiago", "lat": -33.3929, "lon": -70.7858, "country": "CL"}, {"code": "LIM", "city": "Lima", "lat": -12.0219, "lon": -77.1143, "country": "PE"}, {"code": "DXB", "city": "Dubai", "lat": 25.2532, "lon": 55.3657, "country": "AE"}, {"code": "DOH", "city": "Doha", "lat": 25.2731, "lon": 51.6081, "country": "QA"}, {"code": "IST", "city": "Istanbul", "lat": 41.2753, "lon": 28.7519, "country": "TR"}, {"code": "CAI", "city": "Cairo", "lat": 30.1219, "lon": 31.4056, "country": "EG"}, {"code": "JNB", "city": "Johannesburg", "lat": -26.1367, "lon": 28.241, "country": "ZA"}, {"code": "DEL", "city": "Delhi", "lat": 28.5562, "lon": 77.1, "country": "IN"}, {"code": "BKK", "city": "Bangkok", "lat": 13.69, "lon": 100.7501, "country": "TH"}, {"code": "SIN", "city": "Singapore", "lat": 1.3644, "lon": 103.9915, "country": "SG"}, {"code": "HND", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798, "country": "JP"}, {"code": "ICN", "city": "Seoul", "lat": 37.4602, "lon": 126.4407, "country": "KR"}, {"code": "SYD", "city": "Sydney", "lat": -33.9399, "lon": 151.1753, "country": "AU"}, {"code": "AKL", "city": "Auckland", "lat": -37.0082, "lon": 174.785, "country": "NZ"}], "aircraftCatalog": [{"modelId": "NJ-320", "name": "NarrowJet 320", "manufacturer": "AeroWorks", "category": "narrow", "seats": 180, "rangeKm": 5600, "cruiseKts": 450, "price": 603200000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "NJ-319", "name": "NarrowJet 319", "manufacturer": "AeroWorks", "category": "narrow", "seats": 220, "rangeKm": 8700, "cruiseKts": 450, "price": 688400000, "fuelBurnPerKm": 3.17, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "NJ-321", "name": "NarrowJet 321", "manufacturer": "AeroWorks", "category": "narrow", "seats": 180, "rangeKm": 5600, "cruiseKts": 440, "price": 603200000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "NJ-220-1", "name": "CityJet 220-100", "manufacturer": "AeroWorks", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 340, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "NJ-220-3", "name": "CityJet 220-300", "manufacturer": "AeroWorks", "category": "regional", "seats": 100, "rangeKm": 2400, "cruiseKts": 390, "price": 259200000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "SJ-737-7", "name": "SkyJet 737-700", "manufacturer": "SkyCraft", "category": "narrow", "seats": 189, "rangeKm": 8700, "cruiseKts": 430, "price": 651200000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "SJ-737-8", "name": "SkyJet 737-800", "manufacturer": "SkyCraft", "category": "narrow", "seats": 189, "rangeKm": 8700, "cruiseKts": 440, "price": 651200000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "SJ-737-9", "name": "SkyJet 737-900ER", "manufacturer": "SkyCraft", "category": "narrow", "seats": 180, "rangeKm": 5600, "cruiseKts": 450, "price": 603200000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "SJ-737-M8", "name": "SkyJet 737 MAX 8", "manufacturer": "SkyCraft", "category": "narrow", "seats": 180, "rangeKm": 4800, "cruiseKts": 450, "price": 593600000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "SJ-737-M9", "name": "SkyJet 737 MAX 9", "manufacturer": "SkyCraft", "category": "narrow", "seats": 189, "rangeKm": 7400, "cruiseKts": 440, "price": 635600000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "WJ-330-3", "name": "WideTwin 330-300", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 16000, "cruiseKts": 488, "price": 1918000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "WJ-350-9", "name": "WideTwin 350-900", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 15000, "cruiseKts": 490, "price": 1898000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "WJ-350-10", "name": "WideTwin 350-1000", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 11000, "cruiseKts": 490, "price": 1674000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "GJ-380", "name": "GigaJet 380", "manufacturer": "AeroWorks", "category": "jumbo", "seats": 600, "rangeKm": 16000, "cruiseKts": 490, "price": 4000000000, "fuelBurnPerKm": 12.0, "imageRef": "assets/images/aircraft_jumbo.png"}, {"modelId": "WJ-777-3", "name": "WideTwin 777-300ER", "manufacturer": "SkyCraft", "category": "wide", "seats": 250, "rangeKm": 13000, "cruiseKts": 488, "price": 1660000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "WJ-787-9", "name": "WideTwin 787-9", "manufacturer": "SkyCraft", "category": "wide", "seats": 250, "rangeKm": 9000, "cruiseKts": 470, "price": 1580000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "RJ-E175", "name": "RegionalJet E175", "manufacturer": "NovaAir", "category": "regional", "seats": 110, "rangeKm": 1800, "cruiseKts": 430, "price": 266400000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "RJ-E190", "name": "RegionalJet E190", "manufacturer": "NovaAir", "category": "regional", "seats": 110, "rangeKm": 4200, "cruiseKts": 390, "price": 285600000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "RJ-E195E2", "name": "RegionalJet E195E2", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 4200, "cruiseKts": 390, "price": 297600000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "TP-72", "name": "TurboProp 72", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1600, "cruiseKts": 320, "price": 120400000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "TP-Q400", "name": "TurboProp Q400", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 2200, "cruiseKts": 260, "price": 139000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "GA-C172", "name": "SkyTrainer 172", "manufacturer": "GeneralAir", "category": "regional", "seats": 110, "rangeKm": 1800, "cruiseKts": 430, "price": 266400000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "BJ-G650", "name": "BizJet 650", "manufacturer": "Executive", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 430, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "RJ-71", "name": "RegionalJet 71", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 450, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-202", "name": "WideTwin 202", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 11000, "cruiseKts": 490, "price": 1620000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-43", "name": "TurboProp 43", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 2200, "cruiseKts": 280, "price": 139000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-304", "name": "NarrowJet 304", "manufacturer": "AeroWorks", "category": "narrow", "seats": 220, "rangeKm": 7400, "cruiseKts": 440, "price": 672800000, "fuelBurnPerKm": 3.17, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-75", "name": "RegionalJet 75", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 3200, "cruiseKts": 390, "price": 251200000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-206", "name": "WideTwin 206", "manufacturer": "AeroWorks", "category": "wide", "seats": 330, "rangeKm": 13000, "cruiseKts": 460, "price": 1804000000, "fuelBurnPerKm": 7.55, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-47", "name": "TurboProp 47", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1200, "cruiseKts": 320, "price": 118800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-308", "name": "NarrowJet 308", "manufacturer": "AeroWorks", "category": "narrow", "seats": 165, "rangeKm": 8700, "cruiseKts": 450, "price": 622400000, "fuelBurnPerKm": 2.83, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-79", "name": "RegionalJet 79", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 4200, "cruiseKts": 390, "price": 259200000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-210", "name": "WideTwin 210", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 11000, "cruiseKts": 460, "price": 1620000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-51", "name": "TurboProp 51", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1200, "cruiseKts": 260, "price": 118800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-312", "name": "NarrowJet 312", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 7400, "cruiseKts": 450, "price": 648800000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-83", "name": "RegionalJet 83", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 450, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-214", "name": "WideTwin 214", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 11000, "cruiseKts": 490, "price": 1818000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-55", "name": "TurboProp 55", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1400, "cruiseKts": 260, "price": 110600000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-316", "name": "NarrowJet 316", "manufacturer": "AeroWorks", "category": "narrow", "seats": 165, "rangeKm": 7400, "cruiseKts": 450, "price": 606800000, "fuelBurnPerKm": 2.83, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-87", "name": "RegionalJet 87", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 3200, "cruiseKts": 340, "price": 265600000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-218", "name": "WideTwin 218", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 16000, "cruiseKts": 490, "price": 1810000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-59", "name": "TurboProp 59", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1200, "cruiseKts": 280, "price": 118800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "RJ-91", "name": "RegionalJet 91", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 4200, "cruiseKts": 390, "price": 244800000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-222", "name": "WideTwin 222", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 11000, "cruiseKts": 490, "price": 1710000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-63", "name": "TurboProp 63", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 2200, "cruiseKts": 260, "price": 122800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-324", "name": "NarrowJet 324", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 8700, "cruiseKts": 430, "price": 604400000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-95", "name": "RegionalJet 95", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 5200, "cruiseKts": 340, "price": 267200000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-226", "name": "WideTwin 226", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 9000, "cruiseKts": 460, "price": 1670000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-67", "name": "TurboProp 67", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1600, "cruiseKts": 320, "price": 111400000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-328", "name": "NarrowJet 328", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 6500, "cruiseKts": 440, "price": 638000000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-99", "name": "RegionalJet 99", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 1800, "cruiseKts": 430, "price": 240000000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-230", "name": "WideTwin 230", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 11000, "cruiseKts": 460, "price": 1710000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-71", "name": "TurboProp 71", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1400, "cruiseKts": 300, "price": 119600000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-332", "name": "NarrowJet 332", "manufacturer": "AeroWorks", "category": "narrow", "seats": 165, "rangeKm": 5600, "cruiseKts": 440, "price": 585200000, "fuelBurnPerKm": 2.83, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-103", "name": "RegionalJet 103", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 4200, "cruiseKts": 450, "price": 273600000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-234", "name": "WideTwin 234", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 9000, "cruiseKts": 460, "price": 1778000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-75", "name": "TurboProp 75", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 1200, "cruiseKts": 260, "price": 135000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-336", "name": "NarrowJet 336", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 5600, "cruiseKts": 450, "price": 567200000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-107", "name": "RegionalJet 107", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 4200, "cruiseKts": 340, "price": 244800000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-238", "name": "WideTwin 238", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 13000, "cruiseKts": 490, "price": 1858000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-79", "name": "TurboProp 79", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1600, "cruiseKts": 320, "price": 111400000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-340", "name": "NarrowJet 340", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 6100, "cruiseKts": 450, "price": 633200000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-111", "name": "RegionalJet 111", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 2400, "cruiseKts": 390, "price": 283200000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-242", "name": "WideTwin 242", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 13000, "cruiseKts": 488, "price": 1858000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-83", "name": "TurboProp 83", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 2200, "cruiseKts": 260, "price": 113800000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-344", "name": "NarrowJet 344", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 4800, "cruiseKts": 430, "price": 557600000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-115", "name": "RegionalJet 115", "manufacturer": "NovaAir", "category": "regional", "seats": 110, "rangeKm": 5200, "cruiseKts": 390, "price": 293600000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-246", "name": "WideTwin 246", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 15000, "cruiseKts": 470, "price": 1790000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-87", "name": "TurboProp 87", "manufacturer": "TwinProp", "category": "turboprop", "seats": 70, "rangeKm": 1200, "cruiseKts": 280, "price": 127800000, "fuelBurnPerKm": 0.87, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-348", "name": "NarrowJet 348", "manufacturer": "AeroWorks", "category": "narrow", "seats": 165, "rangeKm": 5600, "cruiseKts": 450, "price": 585200000, "fuelBurnPerKm": 2.83, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-119", "name": "RegionalJet 119", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 1800, "cruiseKts": 390, "price": 254400000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-250", "name": "WideTwin 250", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 9000, "cruiseKts": 488, "price": 1580000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-91", "name": "TurboProp 91", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1600, "cruiseKts": 280, "price": 111400000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-352", "name": "NarrowJet 352", "manufacturer": "AeroWorks", "category": "narrow", "seats": 189, "rangeKm": 4800, "cruiseKts": 440, "price": 604400000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-123", "name": "RegionalJet 123", "manufacturer": "NovaAir", "category": "regional", "seats": 70, "rangeKm": 1800, "cruiseKts": 450, "price": 218400000, "fuelBurnPerKm": 1.22, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-254", "name": "WideTwin 254", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 11000, "cruiseKts": 470, "price": 1818000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-95", "name": "TurboProp 95", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 1600, "cruiseKts": 300, "price": 136600000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-356", "name": "NarrowJet 356", "manufacturer": "AeroWorks", "category": "narrow", "seats": 189, "rangeKm": 7400, "cruiseKts": 430, "price": 635600000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-127", "name": "RegionalJet 127", "manufacturer": "NovaAir", "category": "regional", "seats": 70, "rangeKm": 3200, "cruiseKts": 340, "price": 229600000, "fuelBurnPerKm": 1.22, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-258", "name": "WideTwin 258", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 11000, "cruiseKts": 460, "price": 1620000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-99", "name": "TurboProp 99", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 2200, "cruiseKts": 300, "price": 139000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-360", "name": "NarrowJet 360", "manufacturer": "AeroWorks", "category": "narrow", "seats": 220, "rangeKm": 7400, "cruiseKts": 440, "price": 672800000, "fuelBurnPerKm": 3.17, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-131", "name": "RegionalJet 131", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 4200, "cruiseKts": 390, "price": 297600000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-262", "name": "WideTwin 262", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 16000, "cruiseKts": 470, "price": 1774000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-103", "name": "TurboProp 103", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 2200, "cruiseKts": 260, "price": 122800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-364", "name": "NarrowJet 364", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 8700, "cruiseKts": 440, "price": 604400000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-135", "name": "RegionalJet 135", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 450, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-266", "name": "WideTwin 266", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 11000, "cruiseKts": 490, "price": 1710000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-107", "name": "TurboProp 107", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1600, "cruiseKts": 280, "price": 120400000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-368", "name": "NarrowJet 368", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 8700, "cruiseKts": 430, "price": 664400000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-139", "name": "RegionalJet 139", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 4200, "cruiseKts": 390, "price": 297600000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-270", "name": "WideTwin 270", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 15000, "cruiseKts": 460, "price": 1898000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-111", "name": "TurboProp 111", "manufacturer": "TwinProp", "category": "turboprop", "seats": 70, "rangeKm": 2200, "cruiseKts": 300, "price": 131800000, "fuelBurnPerKm": 0.87, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-372", "name": "NarrowJet 372", "manufacturer": "AeroWorks", "category": "narrow", "seats": 180, "rangeKm": 4800, "cruiseKts": 430, "price": 593600000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-143", "name": "RegionalJet 143", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 5200, "cruiseKts": 390, "price": 281600000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-274", "name": "WideTwin 274", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 11000, "cruiseKts": 460, "price": 1710000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-115", "name": "TurboProp 115", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1200, "cruiseKts": 300, "price": 109800000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-376", "name": "NarrowJet 376", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 6500, "cruiseKts": 430, "price": 638000000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-147", "name": "RegionalJet 147", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 3200, "cruiseKts": 430, "price": 265600000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-278", "name": "WideTwin 278", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 15000, "cruiseKts": 460, "price": 1700000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-119", "name": "TurboProp 119", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 1200, "cruiseKts": 260, "price": 135000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-380", "name": "NarrowJet 380", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 5600, "cruiseKts": 440, "price": 567200000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-151", "name": "RegionalJet 151", "manufacturer": "NovaAir", "category": "regional", "seats": 110, "rangeKm": 4200, "cruiseKts": 390, "price": 285600000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-282", "name": "WideTwin 282", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 11000, "cruiseKts": 490, "price": 1674000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-123", "name": "TurboProp 123", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 1200, "cruiseKts": 300, "price": 135000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-384", "name": "NarrowJet 384", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 6100, "cruiseKts": 450, "price": 573200000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-155", "name": "RegionalJet 155", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 5200, "cruiseKts": 430, "price": 252800000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-286", "name": "WideTwin 286", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 11000, "cruiseKts": 490, "price": 1818000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-127", "name": "TurboProp 127", "manufacturer": "TwinProp", "category": "turboprop", "seats": 70, "rangeKm": 2200, "cruiseKts": 280, "price": 131800000, "fuelBurnPerKm": 0.87, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-388", "name": "NarrowJet 388", "manufacturer": "AeroWorks", "category": "narrow", "seats": 189, "rangeKm": 6100, "cruiseKts": 430, "price": 620000000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-159", "name": "RegionalJet 159", "manufacturer": "NovaAir", "category": "regional", "seats": 110, "rangeKm": 3200, "cruiseKts": 430, "price": 277600000, "fuelBurnPerKm": 1.4, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-290", "name": "WideTwin 290", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 9000, "cruiseKts": 488, "price": 1670000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-131", "name": "TurboProp 131", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 2200, "cruiseKts": 260, "price": 139000000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-392", "name": "NarrowJet 392", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 6100, "cruiseKts": 430, "price": 633200000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-163", "name": "RegionalJet 163", "manufacturer": "NovaAir", "category": "regional", "seats": 70, "rangeKm": 4200, "cruiseKts": 340, "price": 237600000, "fuelBurnPerKm": 1.22, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-294", "name": "WideTwin 294", "manufacturer": "AeroWorks", "category": "wide", "seats": 250, "rangeKm": 11000, "cruiseKts": 488, "price": 1620000000, "fuelBurnPerKm": 6.88, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-135", "name": "TurboProp 135", "manufacturer": "TwinProp", "category": "turboprop", "seats": 78, "rangeKm": 1600, "cruiseKts": 300, "price": 136600000, "fuelBurnPerKm": 0.9, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-396", "name": "NarrowJet 396", "manufacturer": "AeroWorks", "category": "narrow", "seats": 189, "rangeKm": 6100, "cruiseKts": 430, "price": 620000000, "fuelBurnPerKm": 2.98, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-167", "name": "RegionalJet 167", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 2400, "cruiseKts": 390, "price": 244800000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-298", "name": "WideTwin 298", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 9000, "cruiseKts": 490, "price": 1634000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-139", "name": "TurboProp 139", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1200, "cruiseKts": 280, "price": 109800000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-400", "name": "NarrowJet 400", "manufacturer": "AeroWorks", "category": "narrow", "seats": 165, "rangeKm": 6100, "cruiseKts": 430, "price": 591200000, "fuelBurnPerKm": 2.83, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-171", "name": "RegionalJet 171", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 3200, "cruiseKts": 340, "price": 236800000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-302", "name": "WideTwin 302", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 13000, "cruiseKts": 490, "price": 1750000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-143", "name": "TurboProp 143", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1400, "cruiseKts": 260, "price": 119600000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-404", "name": "NarrowJet 404", "manufacturer": "AeroWorks", "category": "narrow", "seats": 180, "rangeKm": 8700, "cruiseKts": 450, "price": 640400000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-175", "name": "RegionalJet 175", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 2400, "cruiseKts": 430, "price": 230400000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-306", "name": "WideTwin 306", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 9000, "cruiseKts": 488, "price": 1634000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-147", "name": "TurboProp 147", "manufacturer": "TwinProp", "category": "turboprop", "seats": 70, "rangeKm": 2200, "cruiseKts": 260, "price": 131800000, "fuelBurnPerKm": 0.87, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-408", "name": "NarrowJet 408", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 7400, "cruiseKts": 430, "price": 648800000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-179", "name": "RegionalJet 179", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 3200, "cruiseKts": 450, "price": 289600000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-310", "name": "WideTwin 310", "manufacturer": "AeroWorks", "category": "wide", "seats": 360, "rangeKm": 11000, "cruiseKts": 490, "price": 1818000000, "fuelBurnPerKm": 7.8, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-151", "name": "TurboProp 151", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1200, "cruiseKts": 320, "price": 109800000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-412", "name": "NarrowJet 412", "manufacturer": "AeroWorks", "category": "narrow", "seats": 150, "rangeKm": 7400, "cruiseKts": 450, "price": 588800000, "fuelBurnPerKm": 2.74, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-183", "name": "RegionalJet 183", "manufacturer": "NovaAir", "category": "regional", "seats": 88, "rangeKm": 5200, "cruiseKts": 430, "price": 267200000, "fuelBurnPerKm": 1.3, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-314", "name": "WideTwin 314", "manufacturer": "AeroWorks", "category": "wide", "seats": 280, "rangeKm": 13000, "cruiseKts": 460, "price": 1714000000, "fuelBurnPerKm": 7.13, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-155", "name": "TurboProp 155", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 2200, "cruiseKts": 260, "price": 122800000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-416", "name": "NarrowJet 416", "manufacturer": "AeroWorks", "category": "narrow", "seats": 180, "rangeKm": 4800, "cruiseKts": 440, "price": 593600000, "fuelBurnPerKm": 2.92, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-187", "name": "RegionalJet 187", "manufacturer": "NovaAir", "category": "regional", "seats": 76, "rangeKm": 1800, "cruiseKts": 340, "price": 225600000, "fuelBurnPerKm": 1.25, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-318", "name": "WideTwin 318", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 13000, "cruiseKts": 488, "price": 1750000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-159", "name": "TurboProp 159", "manufacturer": "TwinProp", "category": "turboprop", "seats": 60, "rangeKm": 1600, "cruiseKts": 280, "price": 120400000, "fuelBurnPerKm": 0.83, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-420", "name": "NarrowJet 420", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 4800, "cruiseKts": 450, "price": 617600000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-191", "name": "RegionalJet 191", "manufacturer": "NovaAir", "category": "regional", "seats": 120, "rangeKm": 1800, "cruiseKts": 450, "price": 278400000, "fuelBurnPerKm": 1.45, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-322", "name": "WideTwin 322", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 11000, "cruiseKts": 490, "price": 1710000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-163", "name": "TurboProp 163", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1600, "cruiseKts": 320, "price": 111400000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}, {"modelId": "NJ-424", "name": "NarrowJet 424", "manufacturer": "AeroWorks", "category": "narrow", "seats": 200, "rangeKm": 6100, "cruiseKts": 450, "price": 633200000, "fuelBurnPerKm": 3.05, "imageRef": "assets/images/aircraft_narrow.png"}, {"modelId": "RJ-195", "name": "RegionalJet 195", "manufacturer": "NovaAir", "category": "regional", "seats": 100, "rangeKm": 5200, "cruiseKts": 450, "price": 281600000, "fuelBurnPerKm": 1.35, "imageRef": "assets/images/aircraft_regional.png"}, {"modelId": "WJ-326", "name": "WideTwin 326", "manufacturer": "AeroWorks", "category": "wide", "seats": 300, "rangeKm": 13000, "cruiseKts": 470, "price": 1750000000, "fuelBurnPerKm": 7.3, "imageRef": "assets/images/aircraft_wide.png"}, {"modelId": "TP-167", "name": "TurboProp 167", "manufacturer": "TwinProp", "category": "turboprop", "seats": 50, "rangeKm": 1200, "cruiseKts": 300, "price": 109800000, "fuelBurnPerKm": 0.79, "imageRef": "assets/images/aircraft_turboprop.png"}], "fleet": [{"tail": "NA-001", "modelId": "NJ-320", "condition": 0.92, "ageDays": 120, "status": "OK"}, {"tail": "NA-002", "modelId": "RJ-E190", "condition": 0.88, "ageDays": 240, "status": "OK"}], "routes": [{"routeId": "R1", "origin": "GRU", "destination": "GIG", "ticketPrice": 420, "frequencyPerDay": 6, "baseDemand": 0.85, "competition": 0.25, "active": true, "minCategory": "regional"}, {"routeId": "R2", "origin": "GRU", "destination": "BSB", "ticketPrice": 480, "frequencyPerDay": 5, "baseDemand": 0.75, "competition": 0.25, "active": true, "minCategory": "regional"}, {"routeId": "R3", "origin": "GRU", "destination": "SSA", "ticketPrice": 520, "frequencyPerDay": 4, "baseDemand": 0.7, "competition": 0.35, "active": true, "minCategory": "narrow"}, {"routeId": "R4", "origin": "GRU", "destination": "POA", "ticketPrice": 540, "frequencyPerDay": 4, "baseDemand": 0.72, "competition": 0.3, "active": true, "minCategory": "narrow"}, {"routeId": "R5", "origin": "GRU", "destination": "JFK", "ticketPrice": 980, "frequencyPerDay": 1, "baseDemand": 0.55, "competition": 0.55, "active": true, "minCategory": "wide"}, {"routeId": "R6", "origin": "LHR", "destination": "CDG", "ticketPrice": 220, "frequencyPerDay": 8, "baseDemand": 0.9, "competition": 0.4, "active": true, "minCategory": "regional"}, {"routeId": "R7", "origin": "DXB", "destination": "SIN", "ticketPrice": 650, "frequencyPerDay": 2, "baseDemand": 0.7, "competition": 0.5, "active": true, "minCategory": "wide"}, {"routeId": "R8", "origin": "HND", "destination": "ICN", "ticketPrice": 240, "frequencyPerDay": 6, "baseDemand": 0.88, "competition": 0.45, "active": true, "minCategory": "regional"}], "flights": [], "staff": [{"id": "S1", "name": "Carlos", "role": "Piloto", "salary": 120000, "skill": 0.68, "morale": 0.78}, {"id": "S2", "name": "Mariana", "role": "Copiloto", "salary": 85000, "skill": 0.62, "morale": 0.74}, {"id": "S3", "name": "João", "role": "Mecânico", "salary": 70000, "skill": 0.66, "morale": 0.72}], "candidates": [{"id": "C1", "name": "Ana", "role": "Piloto", "salary": 110000, "skill": 0.6}, {"id": "C2", "name": "Rafael", "role": "Mecânico", "salary": 65000, "skill": 0.58}, {"id": "C3", "name": "Beatriz", "role": "Comissário", "salary": 52000, "skill": 0.54}], "missions": [{"id": "M1", "name": "Primeira rota lucrativa", "desc": "Ative uma rota e conclua 3 voos com lucro positivo.", "reward": 250000, "type": "profitFlights", "target": 3}, {"id": "M2", "name": "Expansão da frota", "desc": "Compre sua 3ª aeronave.", "reward": 300000, "type": "fleetSize", "target": 3}]};

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return deepClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return mergeState(deepClone(DEFAULT_STATE), parsed);
    } catch(e) {
      console.warn("[STORE] Falha ao carregar save. Usando padrão.", e);
      return deepClone(DEFAULT_STATE);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch(e) {
      console.warn("[STORE] Falha ao salvar.", e);
    }
  }

  function clearSave() {
    localStorage.removeItem(LS_KEY);
  }

  function loadDlc() {
    try {
      const raw = localStorage.getItem(DLC_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) {
      return null;
    }
  }

  function saveDlc(dlcObj) {
    localStorage.setItem(DLC_KEY, JSON.stringify(dlcObj || {}));
    window.dispatchEvent(new Event("dlc-updated"));
  }

  function mergeState(base, incoming) {
    // merge raso para chaves principais (mantém compatibilidade)
    for (const k of Object.keys(incoming || {})) {
      if (incoming[k] !== undefined) base[k] = incoming[k];
    }
    if (!base.meta) base.meta = {version:1};
    return base;
  }

  function getAirport(code) {
    return (window.flightData.airports || []).find(a => a.code === code);
  }

  function getModel(modelId) {
    return (window.flightData.aircraftCatalog || []).find(m => m.modelId === modelId);
  }

  function uid(prefix="ID") {
    return prefix + "-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  }

  function distanceKm(a, b) {
    // haversine
    const R = 6371;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    return R * c;
  }

  function clamp01(x) {
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  function computeDemand(route, companyRep) {
    // demanda efetiva varia com reputação e competição
    const base = clamp01(route.baseDemand ?? 0.6);
    const comp = clamp01(route.competition ?? 0.3);
    const rep = clamp01(companyRep ?? 0.5);
    // competição reduz, reputação aumenta
    const d = clamp01(base * (0.70 + rep * 0.60) * (1.0 - comp*0.55));
    return d;
  }

  function estimateLoadFactor(demand, price) {
    // preço maior reduz ocupação; preço menor aumenta ocupação
    const p = Math.max(1, Number(price || 1));
    const priceFactor = clamp01(1.15 - (p / 1200));
    return clamp01(demand * (0.55 + 0.65 * priceFactor));
  }

  function generateFlightsForDay(state) {
    // Gera voos planejados do dia a partir das rotas ativas
    state.flights = state.flights || [];
    const airports = state.airports || [];
    for (const r of (state.routes || [])) {
      if (!r.active) continue;
      const o = airports.find(a => a.code === r.origin);
      const d = airports.find(a => a.code === r.destination);
      if (!o || !d) continue;

      const freq = Math.max(1, Number(r.frequencyPerDay || 1));
      for (let i=0; i<freq; i++) {
        // se já existe voo desse routeId ainda não finalizado no dia, não duplica agressivo
        const existing = state.flights.find(f => f.routeId===r.routeId && f.status!=="FINALIZADO" && f.day===state.time.day);
        if (existing && freq<=2) break;

        const fId = uid("FL");
        const dist = distanceKm(o, d);

        // Seleciona um avião disponível que atende categoria mínima
        const plane = pickPlaneForRoute(state, r, dist);
        if (!plane) continue;

        state.flights.push({
          id: fId,
          day: state.time.day,
          flightNumber: "FS" + String(Math.floor(1000 + Math.random()*9000)),
          routeId: r.routeId,
          origin: {code:o.code, city:o.city, lat:o.lat, lon:o.lon},
          destination: {code:d.code, city:d.city, lat:d.lat, lon:d.lon},
          modelId: plane.modelId,
          tail: plane.tail,
          distanceKm: dist,
          progress01: 0,
          status: "EM_ROTA",
          // economia calculada ao concluir
          revenue: 0,
          cost: 0,
          profit: 0
        });
      }
    }
  }

  function categoryRank(cat) {
    const order = {turboprop:0, regional:1, narrow:2, wide:3, jumbo:4};
    return order[cat] ?? 1;
  }

  function pickPlaneForRoute(state, route, distKm) {
    const minCat = route.minCategory || "regional";
    const minRank = categoryRank(minCat);

    // candidatos da frota em condição e alcance
    const candidates = (state.fleet || []).filter(p => p.status === "OK");
    let best = null;
    let bestScore = -1;

    for (const p of candidates) {
      const m = getModelFromState(state, p.modelId);
      if (!m) continue;
      if (categoryRank(m.category) < minRank) continue;
      if ((m.rangeKm || 0) < distKm * 1.05) continue;

      // score: condição + capacidade + economia (menor fuelBurnPerKm melhor)
      const cond = clamp01(p.condition ?? 0.8);
      const seats = Number(m.seats || 100);
      const fuel = Number(m.fuelBurnPerKm || 2.0);
      const score = cond*0.55 + (Math.min(seats, 360)/360)*0.35 + (1/(0.8+fuel))*0.10;
      if (score > bestScore) {
        bestScore = score;
        best = { modelId: m.modelId, tail: p.tail };
      }
    }
    return best;
  }

  function getModelFromState(state, modelId) {
    return (state.aircraftCatalog || []).find(x => x.modelId === modelId);
  }

  function completeFlight(state, flightId) {
    const f = (state.flights || []).find(x => String(x.id) === String(flightId));
    if (!f || f.status === "FINALIZADO") return null;

    const route = (state.routes || []).find(r => r.routeId === f.routeId);
    const model = getModelFromState(state, f.modelId);
    if (!route || !model) return null;

    const rep = state.company?.reputation ?? 0.5;
    const demand = computeDemand(route, rep);
    const loadFactor = estimateLoadFactor(demand, route.ticketPrice);

    const seats = Number(model.seats || 100);
    const pax = Math.max(0, Math.floor(seats * loadFactor));
    const ticket = Number(route.ticketPrice || 0);

    const revenue = pax * ticket;

    // custos
    const fuelCostPerKm = 1.1; // custo unidade (ajustável)
    const fuelBurn = Number(model.fuelBurnPerKm || 2.0); // "unidades" por km
    const fuelCost = f.distanceKm * fuelBurn * fuelCostPerKm;

    const fixedFees = 1200 + f.distanceKm * 0.25; // taxas de aeroporto / navegação
    const wear = 0.003 + f.distanceKm/800000; // desgaste
    applyWear(state, f.tail, wear);

    const cost = fuelCost + fixedFees;
    const profit = revenue - cost;

    // reputação ajusta levemente
    const repDelta = profit > 0 ? 0.004 : -0.006;
    state.company.reputation = clamp01((state.company.reputation || 0.5) + repDelta);

    state.company.cash = Math.round((state.company.cash || 0) + profit);

    f.status = "FINALIZADO";
    f.revenue = Math.round(revenue);
    f.cost = Math.round(cost);
    f.profit = Math.round(profit);

    state.ledger = state.ledger || [];
    state.ledger.unshift({
      ts: Date.now(),
      type: "VOO",
      ref: f.flightNumber,
      detail: `${f.origin.code}→${f.destination.code} • ${model.name} • Pax ${pax}/${seats}`,
      amount: Math.round(profit)
    });
    state.ledger = state.ledger.slice(0, 40);

    return f;
  }

  function applyWear(state, tail, wear) {
    const p = (state.fleet || []).find(x => x.tail === tail);
    if (!p) return;
    p.condition = clamp01((p.condition ?? 0.9) - wear);
    p.ageDays = (p.ageDays || 0) + 1;
    if (p.condition < 0.25) p.status = "MANUTENCAO";
  }

  function startMaintenance(state, tail) {
    const p = (state.fleet || []).find(x => x.tail === tail);
    if (!p) return false;
    if (p.status === "MANUTENCAO") return false;
    p.status = "MANUTENCAO";
    return true;
  }

  function finishMaintenance(state, tail) {
    const p = (state.fleet || []).find(x => x.tail === tail);
    if (!p) return false;
    // custo de manutenção
    const cost = Math.round(60_000 + (1 - (p.condition ?? 0.7)) * 220_000);
    state.company.cash -= cost;
    state.ledger.unshift({
      ts: Date.now(),
      type: "MANUTENCAO",
      ref: tail,
      detail: "Manutenção concluída",
      amount: -cost
    });
    p.condition = clamp01(Math.max(p.condition ?? 0.7, 0.82) + 0.12);
    p.status = "OK";
    return true;
  }

  function buyAircraft(state, modelId) {
    const model = getModelFromState(state, modelId);
    if (!model) return {ok:false, reason:"Modelo não encontrado"};
    const price = Number(model.price || 0);
    if ((state.company.cash || 0) < price) return {ok:false, reason:"Caixa insuficiente"};

    const tail = "NA-" + String(Math.floor(100 + Math.random()*900));
    state.company.cash = Math.round((state.company.cash || 0) - price);
    state.fleet.push({ tail, modelId, condition: 0.97, ageDays: 0, status:"OK" });
    state.ledger.unshift({ ts: Date.now(), type:"COMPRA", ref: tail, detail: model.name, amount: -price });
    return {ok:true, tail};
  }

  function createRoute(state, origin, destination, ticketPrice, freq, demand, competition, minCategory) {
    const o = (state.airports || []).find(a => a.code === origin);
    const d = (state.airports || []).find(a => a.code === destination);
    if (!o || !d) return {ok:false, reason:"Aeroporto inválido"};
    if (origin === destination) return {ok:false, reason:"Origem e destino iguais"};

    const routeId = uid("R");
    state.routes.push({
      routeId,
      origin,
      destination,
      ticketPrice: Number(ticketPrice || 0),
      frequencyPerDay: Math.max(1, Number(freq || 1)),
      baseDemand: clamp01(Number(demand || 0.6)),
      competition: clamp01(Number(competition || 0.3)),
      active: true,
      minCategory: minCategory || "regional"
    });
    return {ok:true, routeId};
  }

  function hire(state, candidateId) {
    const idx = (state.candidates || []).findIndex(c => c.id === candidateId);
    if (idx < 0) return {ok:false, reason:"Candidato inválido"};
    const c = state.candidates[idx];
    // custo inicial
    const cost = Math.round((c.salary || 0) * 0.2);
    if ((state.company.cash || 0) < cost) return {ok:false, reason:"Caixa insuficiente"};
    state.company.cash -= cost;
    state.staff.push({
      id: uid("S"),
      name: c.name,
      role: c.role,
      salary: c.salary,
      skill: clamp01(c.skill ?? 0.55),
      morale: 0.72
    });
    state.candidates.splice(idx, 1);
    state.ledger.unshift({ ts: Date.now(), type:"RH", ref:c.name, detail:"Contratação", amount:-cost });
    return {ok:true};
  }

  function advanceMinute(state, minutes=1) {
    state.time.minuteOfDay += minutes;
    if (state.time.minuteOfDay >= 24*60) {
      state.time.minuteOfDay -= 24*60;
      state.time.day += 1;
      // ao virar o dia, gera voos
      generateFlightsForDay(state);
    }
  }

  function initState() {
    const state = load();
    // aplica DLC local (se existir)
    const dlc = loadDlc();
    if (dlc && typeof dlc === "object") {
      if (Array.isArray(dlc.aircraftCatalog)) state.aircraftCatalog = dlc.aircraftCatalog;
      if (Array.isArray(dlc.airports)) state.airports = dlc.airports;
      if (Array.isArray(dlc.missions)) state.missions = dlc.missions;
      if (Array.isArray(dlc.candidates)) state.candidates = dlc.candidates;
    }
    // se não há voos ainda no dia atual, gera
    if (!state.flights || state.flights.length === 0) generateFlightsForDay(state);
    return state;
  }

  // Expor
  window.FlySimStore = {
    load: initState,
    save,
    clearSave,
    loadDlc,
    saveDlc,
    uid,
    getAirport: (code) => getAirport(code),
    getModel: (id) => getModel(id),
    distanceKm,
    computeDemand,
    estimateLoadFactor,
    completeFlight: (flightId) => completeFlight(window.flightData, flightId),
    startMaintenance: (tail) => startMaintenance(window.flightData, tail),
    finishMaintenance: (tail) => finishMaintenance(window.flightData, tail),
    buyAircraft: (modelId) => buyAircraft(window.flightData, modelId),
    createRoute: (origin, dest, price, freq, demand, comp, minCat) => createRoute(window.flightData, origin, dest, price, freq, demand, comp, minCat),
    hire: (candidateId) => hire(window.flightData, candidateId),
    advanceMinute: (mins=1) => advanceMinute(window.flightData, mins),
  };

  window.flightData = initState();

})();
