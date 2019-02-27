const request = require('request-promise');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
let getInfoProduct = async url=>{
  let html = await request(url);
  let $ = cheerio.load(html);
  let name = $("div#product-title").find("h1").text().replace(/(?:\\[tn]|[\t\n])/g,"").replace(/\s\s+/g, ' ').trim();
  let brand = $("span[itemprop='brand']").text();
  let category = null;
  let pharmacy = null;
  if($("span[itemprop='name']").eq(0).text().trim() === 'Pharmacy'){
      pharmacy = $("span[itemprop='name']").eq(1).text().trim()
  }else{
      category = $("span[itemprop='name']").eq(0).text().trim()
  }
  let reviews = $("span.hide-large").text();
  let oldPrice = $("li.list-price").find('p.price').text().replace(/(?:\\[tn]|[\t\n])/g,"").trim() || null;
  let price = $("li.our-price").find('p.price').text().replace(/(?:\\[tn]|[\t\n])/g,"").replace(/\s\s+/g, ' ').trim() || null;
  let save = $("li.you-save").find('p.price').text().replace(/(?:\\[tn]|[\t\n])/g,"").replace(/\s\s+/g, ' ').trim() || null;
  let description = $("section.descriptions__content").text().replace(/(?:\\[tn]|[\t\n])/g,"").replace(/\s\s+/g, ' ') || null;
  let $2 = cheerio.load(description);
  $2('ol').remove();
  $2('p.view-all').remove();
  let images = [];
  $("a[data-ga-type='thumbnail']").each(function(){
      images.push($(this).attr("href"))
  });
  images = Array.from(new Set(images)).filter(e=>{ if(e!=='#') return e});
  let attributes = {};
  $("ul.attributes").find("li").each(function(){
      let name_Attribute = $(this).find("div.title").text().replace(/(?:\\[tn]|[\t\n])/g,"").trim();
      let value_Attribute = $(this).find("div.value").text().replace(/(?:\\[tn]|[\t\n])/g,"").trim();
      attributes[name_Attribute] = value_Attribute;
  });
  return {name,brand,category,pharmacy,reviews,oldPrice,price,save,images,description,attributes}
};
let getLinkProduct = async url=>{
  let html = await request(url);
  let $ = cheerio.load(html);

  let productArr = [];
  $("section.results-products").find("article").each(function(){
      let path = $(this).find("a").attr('href');
      if(path){
          let link = 'https://www.chewy.com'+path
          productArr.push(link)
      }

  });
  let productGetInfo = productArr.map(e=>getInfoProduct(e));
  return await Promise.all(productGetInfo)
};
app.get('/', async (req,res)=> {
    let html = await request('https://www.chewy.com/app/catalog/brands');
    let $ = cheerio.load(html);
    let arr = [];
    $("div.brands-list").find("li").each(function () {
        let name = $(this).find('a').attr('href');
        arr.push(name)
    });
    res.send(arr)

});
app.get('/product',async (req,res)=>{
    let products = await getLinkProduct(req.query.link);
    res.send(products)
});
app.listen(process.env.PORT || 80);