# STM32 Nucleo web dashboard

STM32 Nucleo web dashboard is an interface that allows to register a Nucleo board on AWS IoT cloud platform and to get and inspect data coming from this board. 

## How it works
The home page contains the sign-in and login functions:
- sign-in: the board will be registered on AWS IoT providing the board id (MAC Address of the Nucleo Board) in the input field. This procedure returns a download link where the user can find the key and the certificate to insert in the Nucleo interface (or firmware).
- login: the user provides the board id (MAC Address of the Nucleo Board) in the format FF:FF:FF:FF:FF:FF. If the board is already registered on AWS the user will be automatically redirected to the dashboard page. 


## AWS side
The Nucleo Board, once the certificate and key are setted, should send messages via MQTT protocol. To do that an AWS IoT endpoint is needed, and the board will start sending messages to the correct MQTT topic.
Currently the topic is `mqttclient/prova`. The JSON messages from Nucleo boards must follow this structure: 
```json
{
"Board_id": "FF:FF:FF:FF:FF:FF",
"Temperature":  24.80,
"Humidity":  36.00,
"Pressure":  995.26,
"ACC-X":    4,      
"ACC-Y":   32,     
"ACC-Z": 1002,
"GYR-X": -1540,      
"GYR-Y": -2240,   
"GYR-Z": -210,
"MAG-X":  366,       
"MAG-Y": -210,     
"MAG-Z":  -54
}
```
