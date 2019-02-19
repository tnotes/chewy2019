const request = require('request');
const cheerio = require('cheerio');
const express = require('express');
const app = express();
let FINDid = (text,startS,lastS)=>{
    let start = text.indexOf(startS) + startS.length;
    let last = text.indexOf(lastS,start);

    if(text.indexOf(startS) > -1 && last > -1){
        let sub = text.substring(
            start,last
        );
        return sub;
    }else{
        return null
    }
};
let cookie = 'CGIC=CgtmaXJlZm94LWItZCJ2dGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2Uvd2VicCxpbWFnZS9hcG5nLCovKjtxPTAuOCxhcHBsaWNhdGlvbi9zaWduZWQtZXhjaGFuZ2U7dj1iMg; ANID=AHWqTUk_gAFNtiZfLV7VGqxo1phI5cKgEa5TVKe63gK5RohLu09CQPD62V8kX9En; OTZ=4804616_88_88_104280_84_446940; GOOGLE_ABUSE_EXEMPTION=ID=06e80d86c85a9ec8:TM=1550585301:C=r:IP=68.183.20.145-:S=APGng0uTsRw7OoVWeY6hArWP7ek0gzdJ0Q; 1P_JAR=2019-2-19-14; NID=160=CaywhOzXAuUXJjj9nYwdlBgIRJ6KxQ-9ybB1qeQA-NaFtaKR-mBbhWiYurmFbKicDp7WqBg63l7z_klg2LuU7ogrgaicuuD5tfUTt-5ESMF5_NtcNcGxzNmMnnx_5EacR0lYv8ZtCNllLk70l5WWBungw7foIyrcpjpkDjf8vzJceDNbR-PW7NJiGhY; DV=A_wR1nr6cNYn0PXn5VxrPeK1-WphkJa-nAXwuGDLXAwAAAA; ';
let listId = (url,index)=> {
    return new Promise(resolve=>{
        let options = {
            method:'GET',
            url:url+'&start='+index,
            headers: {
                'cookie':cookie,
                'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
            },
            // proxy: 'http://68.183.20.145:3128'
        };
        request(options,(err,res,body)=>{
            let $ = cheerio.load(body);
            let arrId_Shop = [];
            $("div.sh-pr__product-results").find("div.sh-dlr__list-result").each(function(){
                let path = $(this).find('a[href*="shopping/product/"]').attr('href');

                if(path){
                    let id = FINDid(path,'shopping/product/','?');
                    arrId_Shop.push(id)
                }

            });
            let shopSelect = null;
            $("div.sh-dr__short").find("div.EQ4p8c").each(function(){
                let html = $(this).html();
                if(html.includes('Kmfmkc') && html.includes('nZbkuc OCCxVb')){
                    shopSelect = $(this).text()
                    return
                }
            });

            return resolve({arrId_Shop,shopSelect})
        })
    });
};
let getLinkProduct = linkRaw =>{
    return new Promise(resolve=>{
        request(linkRaw,(err,res,body)=>{
            return resolve(res.request.uri.href)
        })
    })

};
let getGTIN = (id)=>{
    return new Promise(resolve=>{
        let options = {
            method:'GET',
            url:'https://www.google.com/shopping/product/'+id+'/specs',
            headers: {
                'cookie':cookie,
                'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
            },
            // proxy: 'http://68.183.20.145:3128'
        };
        request(options,(err,res,body)=>{
            let $ = cheerio.load(body);
            let section = $("div#specs").find("div.section-inner").html();
            let GTIN = FINDid(section,'GTIN</span><span class="gaBVed">','</span>');
            return resolve(GTIN)
        })
    })
};
let listSellerProduct = ({id,pagination}) =>{
  return new Promise(resolve=>{
      let options = {
          method:'GET',
          url:'https://www.google.com/shopping/product/'+id+'?prds=start:'+pagination,
          headers: {
              'cookie':cookie,
              'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
          },
          // proxy: 'http://68.183.20.145:3128'
      };
      request(options,async (err,res,body)=>{
          let $ = cheerio.load(body);
          let listSeller = [];
          $("table#os-sellers-table").find("tr").each(function(){
              let sellerName = $(this).find("td.os-seller-name").text().trim();
              let price = parseFloat($(this).find("td.os-total-col").text().replace(/[US$]/g,'').replace(',','.').trim()) || 0;
              let link = 'https://www.google.com'+$(this).find("td.os-seller-name").find('a').attr('href');
              let detail = $(this).find('td.os-details-col').text().trim();
              if(sellerName && price && detail !== 'Used'){
                  listSeller.push({sellerName,price,link})

              }
          });
          return resolve(listSeller)
      })
  })
};
let getInfo = (id,shopSelect)=>{
    return new Promise(resolve=>{
        let options = {
            method:'GET',
            url:'https://www.google.com/shopping/product/'+id,
            headers: {
                'cookie':cookie,
                'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
            },
            // proxy: 'http://68.183.20.145:3128'
        };
        request(options,async (err,res,body)=>{
            let $ = cheerio.load(body);
            let section = $("div#specs").find("div.section-inner").html();
            let GTIN = FINDid(section,'GTIN</span><span class="gaBVed">','</span>');
            if(GTIN === null){
                GTIN = await getGTIN(id)
            }
            let listSeller = [];
            let GetTopPriceProduct = async function(pagination){
                let ListPrice = await listSellerProduct({id,pagination})
                if(ListPrice.length>0){
                    listSeller = listSeller.concat(ListPrice);
                    return await GetTopPriceProduct(parseInt(pagination+10))
                }else{
                    return listSeller;
                }
            };
            let ListPriceOfSeller = await GetTopPriceProduct(0);
            ListPriceOfSeller = ListPriceOfSeller.sort(function (a, b) {
                return a.price - b.price;
            });
            let LinkRawProduct = ListPriceOfSeller.filter(e=>{
                if(e.sellerName === shopSelect){
                    return e
                }
            });
            let linkProduct = null;
            if(LinkRawProduct.length > 0){
                linkProduct = await getLinkProduct(LinkRawProduct[0].link);

            }
            ListPriceOfSeller = ListPriceOfSeller.map(e=>{
                return {sellerName:e.sellerName,price:e.price}
            });
            let MinPrice = ListPriceOfSeller[0];
            return resolve({GTIN,ListPriceOfSeller,MinPrice,linkProduct})
        })
    });

};
app.get('/',async (req,res)=>{
    res.writeHead(200, {
        'Content-Type' : 'text/plain; charset=utf-8',
        'Transfer-Encoding' : 'chunked',
        'X-Content-Type-Options' : 'nosniff'
    });
  //  let url = req.query.url;
    let url = 'https://www.google.com/search?q=call+of+duty&client=firefox-b-d&source=lnms&tbm=shop&sa=X&ved=0ahUKEwjGhJ-3iMjgAhWDGt8KHUTKBxUQ_AUIECgD&biw=1366&bih=625';
    if(url === undefined){
        return res.end('Bạn phải điền link theo cú pháp http://34.85.34.111/?url=link_tra_cuu')
    }
    let connection = true;
    req.on('close', function () {
        connection = false;
    });
    let listProductArr = [];
    let GetListProductPagination = async (index)=>{
        let {arrId_Shop,shopSelect} = await listId(url,index);
        let arrId_Shop_Map = arrId_Shop.map(e=>getInfo(e,shopSelect));
        let result = await Promise.all(arrId_Shop_Map);
        if(result.length > 0){
            res.write(JSON.stringify(result));

            if(connection){
                return await GetListProductPagination(parseInt(index+10))
            }
        }else{
            return listProductArr;
        }
    };
    await GetListProductPagination(10);
    res.end();


});
app.listen(80);