"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nodeFetch = require("node-fetch");
class Proposals {
    static GenerateProposal(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const requestOptions = { method: 'GET', };
            const humanReadableMessage = "New Proposal Alert! \n" +
                "Submitted by: " + req.body["contactName"] + "\n" +
                "Email: " + req.body["contactEmail"] + "\n" +
                "IPFS GATEWAY URL FOR JSON CREDENTIAL FOLLOWS: \n";
            const telegramEndpointHumanReadable = "https://api.telegram.org/bot" + process.env.TELEGRAM_BOT_API +
                "/sendMessage?chat_id=" + process.env.CHANNEL_NAME +
                "&text=" + humanReadableMessage;
            yield nodeFetch(telegramEndpointHumanReadable, requestOptions)
                .then((response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                console.log("telegram human message response:", response);
                res.send("proposal sent");
            })).catch(err => {
                console.log("error on telegram human message request:", err);
                res.send(err);
            });
            const pinataRequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
                },
                body: JSON.stringify(req.body)
            };
            const jsonResponse = yield nodeFetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', pinataRequestOptions)
                .then((response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const jsonResponse = yield response.json();
                console.log("credential pinned at hash:", jsonResponse["IpfsHash"]);
                return jsonResponse;
            })).catch(err => {
                console.log("error on ipfs request:", err);
                return null;
            });
            if (jsonResponse == null) {
                return;
            }
            const telegramIPFSHashMsg = "https://api.telegram.org/bot" + process.env.TELEGRAM_BOT_API +
                "/sendMessage?chat_id=" + process.env.CHANNEL_NAME +
                "&text=" + 'https://gateway.pinata.cloud/ipfs/' + jsonResponse["IpfsHash"];
            yield nodeFetch(telegramIPFSHashMsg, requestOptions)
                .then((response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                console.log("telegram ipfs message response:", response);
            })).catch(err => {
                console.log("error on telegram ipfs message request:", err);
            });
        });
    }
}
exports.default = Proposals;
//# sourceMappingURL=Proposals.js.map