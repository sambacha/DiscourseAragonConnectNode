"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nodefetch = require("node-fetch");
const FormData = require('form-data');
class Email {
    static SendEmail(toEmail, vc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const myHeaders = { "Authorization": "Basic YXBpOmU5NTUzNzc4MTU3YWVkOGMxMThjZWJjNWEzMTVkZDAzLTU2NDViMWY5LTRkNTdiNTNi" };
            const emailMessage = "Here is your verified credential: " + vc;
            const formdata = new FormData();
            formdata.append("from", "noreply@researchcollective.io");
            formdata.append("to", toEmail);
            formdata.append("subject", "The Research Collective Approved Your Posting!");
            formdata.append("text", emailMessage);
            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: formdata,
                redirect: 'follow'
            };
            return nodefetch("https://api.mailgun.net/v3/mg.researchcollective.io/messages", requestOptions)
                .then(response => response.text())
                .then(result => {
                return result;
            })
                .catch(error => {
                console.log('error', error);
                return error;
            });
        });
    }
}
exports.default = Email;
//# sourceMappingURL=Email.js.map