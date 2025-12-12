// src/utils/emailTemplates.js
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const templates = {};

// Load templates once
function loadTemplate(name) {
  if (templates[name]) return templates[name];
  const file = path.join(__dirname, '..', 'emails', `${name}.hbs`);
  const source = fs.readFileSync(file, 'utf8');
  templates[name] = handlebars.compile(source);
  return templates[name];
}

/**
 * renderTemplate(name, context) -> html string
 */
function renderTemplate(name, context = {}) {
  const tpl = loadTemplate(name);
  return tpl(context);
}

module.exports = { renderTemplate };
