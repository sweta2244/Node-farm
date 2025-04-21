// module for file system
const fs = require("fs");

// module for netwroking,creating server,fetching from api too
const http = require("http");

// module to parse(separate in form of objects) url
const url = require("url");

// reading templates in app.js
const OverviewTemplate = fs.readFileSync(
  `${__dirname}/Templates/overview.html`,
  "utf-8"
);
const IndividualTemplate = fs.readFileSync(
  `${__dirname}/Templates/individual_card.html`,
  "utf-8"
);
const ProductTemplate = fs.readFileSync(
  `${__dirname}/Templates/product.html`,
  "utf-8"
);

// variables for apidata(js object) and data(json string format)
let apiObj = "";
let data = "";

//fetch api data, method get
http
  .get("http://localhost:8080/api", (res) => {

    // response comes in parts(chunks) , response data
    res.on("data", (chunk) => (data += chunk));

    // response end
    res.on("end", () => {
      parsing(data);
    });
  })
  .on("error", (err) => {
    console.error("Error:", err);
  });

// reading json data from file to create local api
const api = fs.readFileSync(`${__dirname}/data.json`, "utf-8");

// converting json data into js objects
function parsing(data) {
  apiObj = JSON.parse(data);
}

// replacing placeholder with api data. template and each object is passed as argument
const replaceFunction = (IndividualTemplate, item) => {

// /placeholder/g makes changes globally in that template, not one but all occurance are changed 
  let output = IndividualTemplate.replace(/__image__/g, item.image);
  output = output.replace(/__productName__/g, item.productName);
  output = output.replace(/__quantity__/g, item.quantity);
  output = output.replace(/__price__/g, item.price);
  output = output.replace(/__from__/g, item.from);
  output = output.replace(/__nutrients__/g, item.nutrients);
  output = output.replace(/__description__/g, item.description);
  output = output.replace(/__detail__/g, item.id);

//   returns array of string of templates
  return output;
};

//  server is created using http module
http
  .createServer((req, res) => {
    // parsed url(converted single string url into objects)
    const parsedUrl = url.parse(req.url, true);

    // destructured parsedUrl (parsedUrl={hostname:"",pathname:"",...})
    const { pathname, query } = parsedUrl;

    // conditional routing for individual products
    if (pathname === "/" && query.id < apiObj.length) {

        // getting array of product whose id matches with that of query
      let individualProduct = apiObj.filter(
        (item) => item.id === Number(query.id)
      );

    //   replacing placeholder in template with the specific product data
      const templateIndividual = replaceFunction(
        ProductTemplate,
        individualProduct[0]
      );

    //   telling browser about our response type so that it can work accordingly
      res.writeHead(200, { "Content-type": "text/html" });

    //   ending the response
      res.end(templateIndividual);

    //   homepage
    } else if (pathname === "/" || pathname === "/overview" || query === null) {

        // join is necessary as map return array of string of templates. sending each product each mapping to replace function.
      const template = apiObj
        .map((item) => replaceFunction(IndividualTemplate, item))
        .join("");

        // above multiple products are now replaced in the main/container template.
      const final = OverviewTemplate.replace(/__overview__/g, template);
      res.writeHead(200, { "Content-type": "text/html" });
      res.end(final);

    //   local api
    } else if (pathname === "/api") {
      res.writeHead(200, { "Content-type": "application/json" });
      res.end(api);

    //   any other url except what we have defined/require
    } else {
      res.writeHead(404);
      res.end("Page not found");
    }
  })

//   server listens request and send response through this port
  .listen(8080, (err) => {
    console.log("listening to http://localhost:8080");
  });
