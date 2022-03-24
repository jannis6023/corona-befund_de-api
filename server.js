const axios = require("axios");
const querystring = require("querystring");
const cheerio = require('cheerio');
const express = require('express')
const bodyParser = require("body-parser");
const app = express()
const port = 3000

const apiClient = axios.create({
    withCredentials: true
})

app.get('/test', (req, res) => {
    console.log(req.query)
    const guid = req.query.guid;
    console.log(guid)
    const birthDate = req.query.birthDate;
    apiClient.get(`https://lse.corona-befund.de/result/${guid}`, {responseType: 'text'})
        .then(r => {
            const $ = cheerio.load(r.data);
            const token = $('input[name=_token]').get(0).attribs.value;
            let cookieString = "";
            const cookieHeaders = r.headers["set-cookie"];
            cookieHeaders.forEach(c => {
                cookieString = cookieString + c.split('; ')[0] + "; "
            })
            apiClient.post('https://lse.corona-befund.de/result', querystring.stringify({"_token": token, guid: guid, birthdate: birthDate}), {responseType: 'text', headers: {'Cookie': cookieString}})
                .then(r => {
                    const responseHTML = r.data;
                    const resultHTML = responseHTML.split('<!----------- Ergebnis anzeigen ----------->')[1];
                    const $ = cheerio.load(resultHTML, {xml: true});
                    const resultString = $('div[class="vc_col-xs-12 vc_col-sm-12 vc_col-md-12 vc_col-lg-12"]').html();
                    const result = resultString.includes('KEIN ERGEBNIS') ? 'Kein Ergebnis vorliegend' : resultString.includes('POSITIV') ? 'Der Test ist positiv.':'Der Test ist negativ.';
                    res.send(JSON.stringify({
                        result: result,
                        time: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString()
                    }))
                })
                .catch(e => {
                    res.send("Error!")
                })
        })
        .catch(e => {
            res.send("Error!")
        })
})

app.listen(port, () => {
    console.log(`Testinfo app listening on port ${port}`)
})
