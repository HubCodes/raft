import axios from "axios";
import express from "express"
import { Config } from "./config";
import { AppendEntry, RequestVote, RequestVoteReply } from "./message";
import { State } from "./state";

const config: Config = {
	peers: [
		{ id: 1, host: '127.0.0.1', port: 9000 },
		{ id: 2, host: '127.0.0.1', port: 9001 },
	],
	self: { id: 3, host: '127.0.0.1', port: 9002 },
};

const state = new State(config, 0);

const app = express();

app.use(express.json());

app.use((req, res, next) => {
	req.state = state;
	next();
});

app.put('/entry', (req, res) => {
	const message: AppendEntry = req.body;
	if (req.state.isFollower() && !message.entries.length) {
		req.state.resetElectionTimeout().then(handleElectionTimeout);
	}
});

app.post('/vote', (req, res) => {
	const message: RequestVote = req.body;
	if (req.state.isCandidate()) {
		
	}
});

app.listen(config.self.port, () => {
	console.log('Raft server listening at port ' + config.self.port);
});

async function handleElectionTimeout(state: State) {
	state.toCandidate();
	const requests = [];
	for (const peer of config.peers) {
		const requestVote: RequestVote = {
			term: state.getCurrentTerm(),
			candidateId: state.getPeerId(),
			lastLogIndex: state.getLastLogIndex(),
			lastLogTerm: state.getLastLogTerm(),
		}
		requests.push(axios.post(`http://${peer.host}:${peer.port}/vote`, requestVote));
	}
	const replies: RequestVoteReply[] = (await Promise.all(requests)).map(({ data }) => data);
	for (const requestVoteReply of replies) {
		if (requestVoteReply.term === state.getCurrentTerm() && requestVoteReply.voteGranted) {
			state.receiveVote(requestVoteReply.peerId);
		}
	}
	if (state.isCandidate() && state.isReceivedVoteMajority()) {
		state.toLeader();
	}
}

state.start().then(handleElectionTimeout);
