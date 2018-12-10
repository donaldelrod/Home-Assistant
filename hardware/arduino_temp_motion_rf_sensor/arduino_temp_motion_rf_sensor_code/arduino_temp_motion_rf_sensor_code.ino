#include<DHT.h>
#include<SPI.h>
#include<nRF24L01.h>
#include<RF24.h>

#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define PIRPIN 6

RF24 radio(8, 7);

const byte address[6] = "000001";

#define GRNLED 4
#define REDLED 5

float humidity;
float temperature;
bool motion;
int lastMotion;

void setup() {
  // put your setup code here, to run once:
  dht.begin();
  pinMode(PIRPIN, INPUT);
  pinMode(REDLED, OUTPUT);
  pinMode(GRNLED, OUTPUT);
  radio.begin();
  radio.openWritingPipe(address);
  radio.setPALevel(RF24_PA_MIN);
  
}

void loop() {
  // put your main code here, to run repeatedly:
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  String temp_s = String(temperature);
  String humid_s = String(humidity);
  String motion_s = motion ? "true" : "false";
  
  String message = String("/sensors/location/temp.humid.motion " + temp_s + "." + humid_s + "." + motion_s + " end");

  radio.write(message.c_str(), message.length());
  
  delay(5000);
}
