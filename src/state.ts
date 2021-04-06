import random from "random";
import { Config, Peer } from "./config";
import { Log } from "./log";
import { Mode } from "./mode";

const electionTimeout = {
	min: 150,
	max: 300,
};

export type PeerId = number;

export class State {
	private selfPeerId: PeerId;
	private config: Config;
	private mode: Mode;

	private currentTerm: number;
	private votedFor: PeerId | null;
	private receivedVoteFrom: PeerId[];
	private log: Log[];

	private commitIndex: number;
	private lastApplied: number;

	private nextIndex: number | null;
	private matchIndex: number | null;

	private electionTimeout: NodeJS.Timeout | null;
	private leaderTimeout: NodeJS.Timeout | null;

	constructor(config: Config, currentTerm: number) {
		this.selfPeerId = config.self.id;
		this.config = config;
		this.mode = Mode.FOLLOWER;

		this.currentTerm = currentTerm;
		this.votedFor = null;
		this.receivedVoteFrom = [];
		this.log = [{ setNumberTo: 0, term: 0 }];

		this.commitIndex = 0;
		this.lastApplied = 0;

		this.nextIndex = null;
		this.matchIndex = null;

		this.electionTimeout = null;
		this.leaderTimeout = null;
	}

	start(): Promise<this> {
		this.toFollower();
		return this.setElectionTimeout();
	}

	resetElectionTimeout(): Promise<this> {
		this.clearElectionTimeout();
		return this.setElectionTimeout();
	}

	vote(peer: PeerId) {
		if (this.votedFor) {
			throw new Error('Already voted');
		}
		this.votedFor = peer;
	}

	receiveVote(peer: PeerId) {
		this.receivedVoteFrom.push(peer);
	}

	isReceivedVoteMajority(): boolean {
		return this.receivedVoteFrom.length >= Math.ceil(this.config.peers.length / 2);
	}

	getCurrentTerm(): number {
		return this.currentTerm;
	}

	getPeerId(): PeerId {
		return this.selfPeerId;
	}

	getLastLogIndex(): number {
		return this.log.length;
	}

	getLastLogTerm(): number {
		return this.log[this.log.length - 1].term;
	}

	getPeers(): Peer[] {
		return this.config.peers;
	}

	clearVote() {
		this.votedFor = null;
	}

	toFollower() {
		this.mode = Mode.FOLLOWER;
	}

	toCandidate() {
		this.mode = Mode.CANDIDATE;
		this.currentTerm += 1;
		this.vote(this.selfPeerId);
	}

	toLeader() {
		if (this.mode !== Mode.CANDIDATE) {
			throw new Error(`State violation detected: from ${this.mode} to ${Mode.LEADER}`);
		}
	}

	isFollower(): boolean {
		return this.mode === Mode.FOLLOWER;
	}

	isCandidate(): boolean {
		return this.mode === Mode.CANDIDATE;
	}

	isLeader(): boolean {
		return this.mode === Mode.LEADER;
	}

	private setElectionTimeout(): Promise<this> {
		return new Promise(res => {
			this.electionTimeout = setTimeout(() => {
				this.toCandidate();
				res(this);
			}, random.int(electionTimeout.min, electionTimeout.max));
		});
	}

	private clearElectionTimeout() {
		if (this.electionTimeout) {
			clearTimeout(this.electionTimeout);
			this.electionTimeout = null;
		}
	}
}
