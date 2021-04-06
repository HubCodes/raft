import { Log } from "./log";
import { PeerId } from "./state";

export interface AppendEntry {
	term: number;
	leaderId: PeerId;
	prevLogIndex: number;
	prevLogTerm: number;
	entries: Log[];
	leaderCommit: number;
}

export interface AppendEntryReply {
	term: number;
	success: boolean;
}

export interface RequestVote {
	term: number;
	candidateId: PeerId;
	lastLogIndex: number;
	lastLogTerm: number;
}

export interface RequestVoteReply {
	peerId: PeerId;
	term: number;
	voteGranted: boolean;
}
