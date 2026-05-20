// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    address public admin;
    bool public votingOpen;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(string => bool) public voterIdUsed;

    uint public candidatesCount;
    uint public totalVotes;

    event VoteCast(string voterId, uint candidateId, uint timestamp);
    event VotingStarted(uint timestamp);
    event VotingEnded(uint timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyWhenOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    constructor() {
        admin = msg.sender;
        votingOpen = false;

        _addCandidate("Arvind Kumar", "National Progress Party");
        _addCandidate("Priya Sharma", "Democratic Alliance");
        _addCandidate("Rajan Mehta", "People's Front");
    }

    function _addCandidate(string memory _name, string memory _party) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);
    }

    function startVoting() public onlyAdmin {
        votingOpen = true;
        emit VotingStarted(block.timestamp);
    }

    function endVoting() public onlyAdmin {
        votingOpen = false;
        emit VotingEnded(block.timestamp);
    }

    function castVote(uint _candidateId, string memory _voterId) public onlyWhenOpen {
        require(!voterIdUsed[_voterId], "This voter ID has already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        voterIdUsed[_voterId] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(_voterId, _candidateId, block.timestamp);
    }

    function getCandidate(uint _id) public view returns (uint, string memory, string memory, uint) {
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.party, c.voteCount);
    }

    function getCandidatesCount() public view returns (uint) {
        return candidatesCount;
    }

    function hasVoterVoted(string memory _voterId) public view returns (bool) {
        return voterIdUsed[_voterId];
    }
}
