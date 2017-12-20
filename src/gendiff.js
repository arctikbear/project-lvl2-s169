// @flow
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import YAML from 'js-yaml';
import INI from 'ini';

const parseBy = {
  '.json': JSON.parse,
  '.yml': YAML.safeLoad,
  '.yaml': YAML.safeLoad,
  '.ini': INI.parse,
};

const readFromFile = filepath => fs.readFileSync(filepath, 'utf-8');

const getExtension = filepath => path.parse(filepath).ext;

const parseData = (rawData, extension) => parseBy[extension](rawData);

const createObjFromFile = (filepath) => {
  const rawData = readFromFile(filepath);
  const fileExtension = getExtension(filepath);
  return parseData(rawData, fileExtension);
};

const propertyActions = [
  {
    type: 'unchanged',
    check: (key, obj1, obj2) => (obj1[key] && obj2[key])
      && obj1[key] === obj2[key],
  },
  {
    type: 'changed',
    check: (key, obj1, obj2) => (obj1[key] && obj2[key])
      && obj1[key] !== obj2[key],
  },
  {
    type: 'deleted',
    check: (key, obj1, obj2) => obj1[key] && !obj2[key],
  },
  {
    type: 'added',
    check: (key, obj1, obj2) => obj2[key] && !obj1[key],
  },
];

const propertyToString = (type, key, obj1, obj2) => {
  switch (type) {
    case 'unchanged':
      return `    ${key}: ${obj1[key]}`;
    case 'changed':
      return `  - ${key}: ${obj1[key]}\n  + ${key}: ${obj2[key]}`;
    case 'deleted':
      return `  - ${key}: ${obj1[key]}`;
    case 'added':
      return `  + ${key}: ${obj2[key]}`;
    default:
      return 'unknown type';
  }
};

const getPropertyAction = (key, obj1, obj2) =>
  _.find(propertyActions, ({ check }) => check(key, obj1, obj2));

export default (pathToFile1, pathToFile2) => {
  const obj1 = createObjFromFile(pathToFile1);
  const obj2 = createObjFromFile(pathToFile2);
  const keysSet = Object.keys(obj1).concat(Object.keys(obj2));
  const uniqueKeys = _.uniq(keysSet);
  const differences = uniqueKeys.reduce((acc, key) => {
    const { type } = getPropertyAction(key, obj1, obj2);
    return [...acc, `${propertyToString(type, key, obj1, obj2)}\n`].join('');
  }, '');
  return `{\n${differences}}`;
};
