const request = require('request-promise');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors);
let getProduct = async url=>{
  let html = await request(url);
  let $ = cheerio.load(html);

  let productArr = [];
  $("section.results-products").find("article").each(function(){
      let tensanpham = $(this).find("div.content").find('h2').text().replace(/(?:\\[tn]|[\t\n])/g,"").trim();
      let autoship = $(this).find("p.autoship").find("strong").text().trim();
      let gia_moi = $(this).find("p.price").find("strong").text().trim();
      let gia_cu = $(this).find("span.price-old").text().trim();
      let rating = $(this).find("p.rating").find("span").text().trim();
      let shiping = $(this).find("p.shipping").text().trim();
      productArr.push({tensanpham,autoship,gia_moi,gia_cu,rating,shiping})
  });
    return productArr
};
app.get('/', async (req,res)=> {
    res.writeHead(200, {
        'Content-Type' : 'text/plain; charset=utf-8',
        'Transfer-Encoding' : 'chunked',
        'X-Content-Type-Options' : 'nosniff'
    });

    let html = await request('https://www.chewy.com/app/catalog/brands');
    let $ = cheerio.load(html);
    let arr = [];
    $("div.brands-list").find("li").each(function () {
        let name = $(this).text();
        arr.push(name)
    });
    for (let i = 0; i < arr.length; i++) {
        let products = await getProduct('https://www.chewy.com/s?rh=brand_facet%3A' + arr[i].replace(/ /g, '+'))
        res.write(JSON.stringify(products))

    }
    res.end()

});
app.listen(process.env.PORT || 80);