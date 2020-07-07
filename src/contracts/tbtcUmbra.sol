pragma solidity ^0.6.2;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount)
        external
        returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract tbtcUmbra {
    IERC20 TBTC;
    event sendTBTC(
        bytes16 iv, // Inivitalization Vector
        bytes32 pkx, // Ephemeral Public Key
        bytes32 pky,
        bytes32 ct0, // Ciphertext
        bytes32 ct1,
        bytes32 ct2,
        bytes32 mac // Message Authentication Code
    );
    
    constructor(address _tbtc) public {
        TBTC = IERC20(_tbtc);
    }
    
    function transferTBTC(
        address payable _toWhom, 
        uint256 _qty,
        bytes16 iv, // Inivitalization Vector
        bytes32 pkx, // Ephemeral Public Key
        bytes32 pky,
        bytes32 ct0, // Ciphertext
        bytes32 ct1,
        bytes32 ct2,
        bytes32 mac // Message Authentication Code
    ) public payable {
        TBTC.transferFrom(
            msg.sender,
            _toWhom,
            _qty
        );
        _toWhom.transfer(msg.value);
        emit sendTBTC (
            iv, // Inivitalization Vector
            pkx, // Ephemeral Public Key
            pky,
            ct0, // Ciphertext
            ct1,
            ct2,
            mac // Message Authentication Code
        );
    }
}