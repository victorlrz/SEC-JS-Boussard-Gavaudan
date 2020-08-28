const fetch = require("node-fetch");
const JSDOM = require("jsdom");
const util = require("util");

const getXML = async (url) => {
  try {
    let response = await fetch(url);
    if (response.ok) {
      let xml = await response.text();
      // Create empty DOM, the imput param here is for HTML not XML, and we don want to parse HTML
      const dom = new JSDOM.JSDOM("");
      // Get DOMParser, same API as in browser
      const DOMParser = dom.window.DOMParser;
      const parser = new DOMParser();
      // Create document by parsing XML
      const document = parser.parseFromString(xml, "text/xml");
      // save the xml after modifications
      //   const xmlString = document.documentElement.outerHTML;
      //   console.log(xmlString);
      let valuesList = [];
      const values = document.getElementsByTagName("*");
      for (let i = 0; i < values.length; i++) {
        if (values[i].getAttribute("contextRef") !== null) {
          valuesList.push(values[i]);
        }
      }
      // console.log(valuesList);

      //find each element in context
      const cxt = document.getElementsByTagName("context");
      const result = getXMLcontent(cxt, valuesList);
      // console.log(result); Debug -> Seed database with results
    }
  } catch (e) {
    console.log(e);
  }
};
function getSegment(index, tree) {
  let seg = [];
  if (tree[index].children[0].childElementCount > 1) {
    for (
      let i = 0;
      i < tree[index].children[0].children[1].childElementCount;
      i++
    ) {
      seg.push({
        dimension: tree[index].children[0].children[1].children[i].getAttribute(
          "dimension"
        ),
        value: tree[index].children[0].children[1].children[i].innerHTML,
      });
    }
  } else {
    seg = null;
  }
  return seg;
}

function getPeriod(index, tree) {
  let per = [];
  if (tree[index].children[1].childElementCount > 0) {
    for (let i = 0; i < tree[index].children[1].childElementCount; i++) {
      per.push({
        [tree[index].children[1].children[i].tagName]:
          tree[index].children[1].children[i].innerHTML,
      });
    }
  } else {
    per = null;
  }
  return per;
}

function getMetric(values, id) {
  let met = [];
  const found = values.filter((el) => el.getAttribute("contextRef") == id);
  if (found) {
    for (let i = 0; i < found.length; i++) {
      met.push({
        name: found[i].tagName,
        decimals: found[i].getAttribute("decimals"),
        unit: found[i].getAttribute("unitRef"),
        value: found[i].innerHTML,
      });
    }
  } else {
    met = null;
  }
  return met;
}

function getXMLcontent(context, values) {
  let listElm = [];
  for (let i = 0; i < context.length; i++) {
    let element = {
      id: context[i].id,
      entity: {
        identifier: {
          scheme: context[i].children[0].children[0].getAttribute("scheme"),
          CIK: context[i].children[0].children[0].innerHTML,
        },
        segment: null,
      },
      period: null,
      metric: null,
    };
    element.entity.segment = getSegment(i, context);
    element.period = getPeriod(i, context);
    element.metric = getMetric(values, element.id);
    listElm.push(element);
    console.log(util.inspect(element, { showHidden: false, depth: null }));
  }
  return JSON.stringify(listElm);
}
getXML(
  "https://www.sec.gov/Archives/edgar/data/320193/000032019320000062/aapl-20200627_htm.xml"
);
