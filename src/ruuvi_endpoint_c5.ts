import { RuuviTagBroadcast } from './ruuvitagbroadcast';

const dataFormatStart = 0;
const dataFormatEnd = dataFormatStart + 1;
const temperatureStart = dataFormatEnd;
const temperatureEnd = temperatureStart + 2;
const temperatureInvalid = -32768;

const humidityStart = temperatureEnd;
const humidityEnd = humidityStart + 2;
const humidityInvalid = 65535;

const pressureStart = humidityEnd;
const pressureEnd = pressureStart + 2;
const pressureInvalid = 65535;

const powerStart = pressureEnd;
const powerEnd = powerStart + 2;
const batteryInvalid = 1600 + 2047;
const txInvalid = 31;

const movementStart = powerEnd;
const movementEnd = movementStart + 1;
const movementInvalid = 0xff;

const sequenceStart = movementEnd;
const sequenceEnd = sequenceStart + 2;
const sequenceInvalid = 0xffff;

const addressStart = sequenceEnd;
const addressEnd = addressStart + 6;
const addressInvalid = 0xffffffffffff;

export const dfc5parser = (data: Uint8Array): RuuviTagBroadcast => {
  if (data.length < addressEnd - 1 || 0xc5 !== data[0]) {
    throw new Error('Not DFC5 data');
  }
  const robject: RuuviTagBroadcast = new RuuviTagBroadcast();
  robject.dataFormat = data[dataFormatStart];
  const temperatureBytes = data.slice(temperatureStart, temperatureEnd);
  let temperature = temperatureBytes[0] * 256 + temperatureBytes[1];
  if (temperature > 32767) {
    temperature -= 65535;
  }

  robject.temperatureC = temperature === temperatureInvalid ? null : temperature / 200.0;

  const humidityBytes = data.slice(humidityStart, humidityEnd);
  const humidity = humidityBytes[0] * 256 + humidityBytes[1];
  robject.humidityRh = humidityInvalid === humidity ? null : humidity / 400.0;

  const pressureBytes = data.slice(pressureStart, pressureEnd);
  const pressure = pressureBytes[0] * 256 + pressureBytes[1];
  robject.pressurePa = pressureInvalid === pressure ? null : pressure + 50000;

  const powerBytes = data.slice(powerStart, powerEnd);
  const battery = powerBytes[0] * 8 + Math.floor(powerBytes[1] / 32);
  robject.batteryVoltageV = batteryInvalid === battery ? null : (battery + 1600) / 1000.0;
  const tx = powerBytes[1] % 32;
  robject.txPowerDBm = txInvalid === tx ? null : tx * 2 - 40;

  const movementBytes = data.slice(movementStart, movementEnd);
  const movement = movementBytes[0];
  robject.movementCounter = movementInvalid === movement ? null : movement;

  const sequenceBytes = data.slice(sequenceStart, sequenceEnd);
  const sequence = sequenceBytes[0] * 256 + sequenceBytes[1];
  robject.measurementSequence = sequenceInvalid === sequence ? null : sequence;

  const addressBytes = data.slice(addressStart, addressEnd);
  // Sorry, but lint says so.
  const address =
    addressBytes[0] * 256 * 256 * 256 * 256 * 256 +
    addressBytes[1] * 256 * 256 * 256 * 256 +
    addressBytes[2] * 256 * 256 * 256 +
    addressBytes[3] * 256 * 256 +
    addressBytes[4] * 256 +
    addressBytes[5];
  robject.mac = addressInvalid === address ? null : address;

  return robject;
};
