// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract postJob {
    struct jobPosting {
        string title;
        string description;
        string budget;
        string[] tools;
    }

    string[] public jobIds;
    mapping(string => jobPosting) public jobsposting;

    mapping(string => address) public jobOwner;

    function posting(
        string memory _id,
        string memory _title,
        string memory _description,
        string memory _budget,
        string[] memory _tools
    ) public {
        jobsposting[_id] = jobPosting(_title, _description, _budget, _tools);
        jobIds.push(_id);
        jobOwner[_id] = msg.sender;
    }

    function totalJobs() public view returns (uint256) {
        return jobIds.length;
    }

    function getJob(
        string memory _id
    )
        public
        view
        returns (
            string memory title,
            string memory description,
            string memory budget,
            string[] memory tools
        )
    {
        jobPosting storage j = jobsposting[_id];
        return (j.title, j.description, j.budget, j.tools);
    }

    mapping(address => string[]) public appliedJobs;

    function applyJob(string memory _id) public {
        // Prevent duplicate apply (optional)
        string[] storage list = appliedJobs[msg.sender];
        for (uint i = 0; i < list.length; i++) {
            if (keccak256(bytes(list[i])) == keccak256(bytes(_id))) {
                revert("Already Applied");
            }
        }

        list.push(_id);
    }

    function getAppliedJobs(
        address user
    ) public view returns (string[] memory) {
        return appliedJobs[user];
    }
}
