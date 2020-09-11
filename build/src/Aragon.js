"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const connect_1 = require("@aragon/connect");
const connect_app_dandelion_voting_1 = require("@1hive/connect-app-dandelion-voting");
const utils_1 = require("./utils");
const orgAddress = "0xC826A8060F5C3829fC44Be1240beB1287c16858b";
const VOTE_DURATION = 24 * 60 * 60 * 1000;
const TOKEN_REQUEST_LABELS = ["token-request"];
const VOTE_LABELS = ["vote", "experiment"];
class Aragon {
    static NewVoteProposal(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const org = yield connect_1.connect(orgAddress, 'thegraph', { chainId: 4 });
            const aragonVote = new AragonVote(req.body["timestamp"], req.body["url"], req.body["userAddress"], req.body["firstPostContent"]);
            console.log("proposal details:", aragonVote);
            const apps = yield org.apps();
            const { address } = apps.find(app => app.appName.includes("voting"));
            const intent = org.appIntent(address, 'newVote', ["0x", aragonVote.GetJSON(), false]);
            const path = yield intent.paths(aragonVote.posterAddress);
            console.log(path);
            if (path == undefined || !path) {
                utils_1.sendAndLogError(res, "no possible path to vote");
                return;
            }
            console.log("paths:", path);
            res.status(200).send(JSON.stringify(path));
        });
    }
    static NewTokenProposal(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const org = yield connect_1.connect(orgAddress, 'thegraph', { chainId: 4 });
            const aragonVote = new AragonVote(req.body["timestamp"], req.body["url"], req.body["userAddress"], req.body["firstPostContent"]);
            console.log("proposal details:", aragonVote);
            const apps = yield org.apps();
            const { address } = apps.find(app => app.appName.includes("token-request"));
            const intent = org.appIntent(address, 'createTokenRequest', ["0x0000000000000000000000000000000000000000", '0', '0', aragonVote.GetJSON()]);
            const path = yield intent.paths(aragonVote.posterAddress);
            console.log(path);
            if (path == undefined || !path) {
                utils_1.sendAndLogError(res, "no possible path to vote");
                return;
            }
            console.log("paths:", path);
            res.status(200).send(JSON.stringify(path));
        });
    }
    static VoteOnProposal(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const aragonVote = new AragonVote(req.body["timestamp"], req.body["url"], req.body["userAddress"].toLowerCase(), req.body["firstPostContent"]);
            const org = yield connect_1.connect(orgAddress, 'thegraph', { chainId: 4 });
            const apps = yield org.apps();
            const { address } = apps.find(app => app.appName.includes("voting"));
            const voting = new connect_app_dandelion_voting_1.VotingConnectorTheGraph('https://api.thegraph.com/subgraphs/name/1hive/aragon-dandelion-voting-rinkeby');
            const votes = yield voting.votesForApp(address, 1000, 0);
            const isTokenRequest = TOKEN_REQUEST_LABELS.some((label) => {
                return aragonVote.firstPostContent.includes(label);
            });
            let votesWithMatchingMetadata = [];
            if (isTokenRequest) {
                votesWithMatchingMetadata = yield utils_1.asyncFilter(votes, (vote) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const { script } = vote;
                    if (script == "0x") {
                        return false;
                    }
                    const description = yield connect_1.describeScript(script, apps, org.provider).catch(e => {
                        console.log("error describing script:", e, " with script:", script);
                        return false;
                    });
                    if (!description[0]) {
                        return false;
                    }
                    console.log("token request description:", description);
                    return description[0].description.toLowerCase().includes(aragonVote.posterAddress);
                }));
            }
            else {
                votesWithMatchingMetadata = yield utils_1.asyncFilter(votes, (vote) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    console.log("metadata for vote:", vote.metadata);
                    console.log("matches incoming vote json:", vote.metadata.includes(aragonVote.GetJSON()));
                    return vote.metadata.includes(aragonVote.GetJSON());
                }));
            }
            console.log("matching votes:", votesWithMatchingMetadata);
            const matchingOpenVotes = yield utils_1.asyncFilter(votesWithMatchingMetadata, (vote) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const voteStartTime = yield getMSFromBlockNumber(vote.startBlock).catch(e => {
                    console.log("infura error:", e);
                    utils_1.sendAndLogError(res, "error on get block time");
                    return;
                });
                return Date.now() < (voteStartTime + VOTE_DURATION) && !vote.executed;
            }));
            const unvotedOnByUserOpenVotes = yield utils_1.asyncFilter(matchingOpenVotes, (vote) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const casts = yield voting.castsForVote(vote.id, 1000, 0);
                return !casts.some((cast) => {
                    return cast.voter == aragonVote.posterAddress;
                });
            }));
            console.log("unvoted on votes by user:", unvotedOnByUserOpenVotes);
            if (unvotedOnByUserOpenVotes.length == 0) {
                utils_1.sendAndLogError(res, "vote not found or expired already or user already voted");
                return;
            }
            if (unvotedOnByUserOpenVotes.length > 1) {
                if (isTokenRequest) {
                    utils_1.sendAndLogError(res, "too many matching open votes - only one open token request is allowed at a time");
                    return;
                }
                utils_1.sendAndLogError(res, "too many matching open votes");
                return;
            }
            const latestVoteID = unvotedOnByUserOpenVotes[0].id.split("voteId:")[1];
            const intent = yield org.appIntent(address, 'vote', [latestVoteID, req.body["vote"] == "yes"]);
            const path = yield intent.paths(aragonVote.posterAddress);
            if (path == undefined || !path) {
                utils_1.sendAndLogError(res, "no possible path to vote");
                return;
            }
            console.log("paths:", path);
            res.status(200).send(JSON.stringify(path));
        });
    }
}
exports.default = Aragon;
function getMSFromBlockNumber(startBlock) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const params = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "eth_getBlockByNumber",
                "id": 1,
                "params": ["0x" + parseInt(startBlock).toString(16), true]
            })
        };
        const voteStartTime = yield fetch("https://rinkeby.infura.io/v3/" + process.env.INFURA_PROJECT_ID, params)
            .then((response) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const jsonResponse = yield response.json();
            const timestamp = parseInt(jsonResponse.result.timestamp, 16) * 1000;
            return timestamp;
        })).catch(err => {
            console.log("error on infura request:", err);
            return err;
        });
        return voteStartTime;
    });
}
class AragonVote {
    constructor(timestamp, url, posterAddress, firstPostContent) {
        this.timestamp = timestamp;
        this.url = url;
        this.posterAddress = posterAddress;
        this.firstPostContent = firstPostContent;
    }
    GetJSON() {
        return JSON.stringify(this);
    }
}
//# sourceMappingURL=Aragon.js.map