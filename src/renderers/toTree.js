import _ from 'lodash';

const renderToTree = (ast, deepLvl) => {
  const addSpaces = deepLvl * 4;

  const valueToString = (value, deep) => {
    const spaces = deep * 4;
    if (!_.isObject(value)) {
      return value;
    }
    const keys = _.keys(value);
    const result = keys.reduce((acc, key) => {
      if (!_.isObject(value[key])) {
        return [...acc, `${' '.repeat(4 + spaces)}${key}: ${value[key]}\n`];
      }
      return [...acc, `${' '.repeat(4 + spaces)}${key}: ${valueToString(value[key], deep + 1)}\n`];
    }, '');
    return `{\n${result.join('')}${' '.repeat(spaces)}}`;
  };

  const nodeToString = (node) => {
    const { type, key, value } = node;
    const { children } = node;
    const item = children || value;
    switch (type) {
      case 'nested':
        return `${' '.repeat(4 + addSpaces)}${key}: ${renderToTree(children, deepLvl + 1)}`;
      case 'unchanged':
        return `${' '.repeat(4 + addSpaces)}${key}: ${valueToString(item, deepLvl + 1)}`;
      case 'changed':
        return `${' '.repeat(2 + addSpaces)}- ${key}: ${children.old}\n${' '.repeat(2 +
          addSpaces)}+ ${key}: ${children.new}`;
      case 'deleted':
        return `${' '.repeat(2 + addSpaces)}- ${key}: ${valueToString(item, deepLvl + 1)}`;
      case 'added':
        return `${' '.repeat(2 + addSpaces)}+ ${key}: ${valueToString(item, deepLvl + 1)}`;
      default:
        throw new Error('Type of this property does not exist');
    }
  };

  const result = ast.reduce((acc, node) =>
    [...acc, `${nodeToString(node, deepLvl)}\n`].join(''), '');
  return `{\n${result}${' '.repeat(addSpaces)}}`;
};

export default renderToTree;
