// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9; // wersja solidity
// imports
import "./PriceConverter.sol";
//errors
error FundMe__NotOwner();

//interfaces, libraries, contracts

/** @title a contract for crowd funding
 * @author Szymon D
 */

//837,297 gas
contract FundMe {
    using PriceConverter for uint256;

    // STATE VARIABLES

    // uint256 public number;
    uint256 public constant minimumUsd = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;
    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // number = 5;
        require(
            msg.value.getConversionRate(priceFeed) >= minimumUsd,
            "nie wyslano 1 ethera"
        ); // 1e18 == 1* 10 **18 == 1 etherium
        // zwraca gaz jezeli sie nie wykona to co ponizej wiec nie zwaca za przypisanie 5 do number

        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    address public immutable owner;

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
    }

    function cheaperWithdrwa() public payable onlyOwner {
        address[] memory funders1 = funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders1.length;
            funderIndex++
        ) {
            address funder = funders1[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0);
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

    modifier onlyOwner() {
        // require(msg.sender == owner,"Sender is not owner"); tez tak mozna
        if (msg.sender != owner) {
            revert FundMe__NotOwner();
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
