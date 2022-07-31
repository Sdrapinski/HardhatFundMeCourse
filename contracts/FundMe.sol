// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; // wersja solidity

import "./PriceConverter.sol";

error NotOwner();

//837,297 gas
contract FundMe {
    using PriceConverter for uint256;

    // uint256 public number;
    uint256 public constant minimumUsd = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    function fund() public payable {
        // number = 5;
        require(
            msg.value.getConversionRate() >= minimumUsd,
            "nie wyslano 1 ethera"
        ); // 1e18 == 1* 10 **18 == 1 etherium
        // zwraca gaz jezeli sie nie wykona to co ponizej wiec nie zwaca za przypisanie 5 do number

        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    function withdraw() public onlyOwner {
        //for (start index, end index,step amount)
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        //reset the array
        funders = new address[](0);

        //transfer
        // payable(msg.sender).transfer(address(this).balance);
        //send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //  require(sendSuccess,"send failed");
        //cal
        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
        revert();
    }

    modifier onlyOwner() {
        // require(msg.sender == owner,"Sender is not owner"); tez tak mozna
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _; // wykonuje reszte kodu funkcji do ktorej przypsiszesz
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
