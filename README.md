# PrivaSwap
PrivaSwap allows the bitcoin users to transition into Ethereum by not hindering their privacy.

Users can swap their Bitcoins to tBTC tokens on Ethereum powered by Keep Network. These tokens are then transferred to a totally new Stealth Address via Umbra Protocol maintaining the Privacy of the User.

## Benefit of using Umbra Protocol with tBTC
Umbra offers a ton of benefits as compared to Tornado Cash:

* Valid for any arbitrary amount of Tokens (Not dependent on Slot Sizes)
* No Waiting time as instant and direct transfer
* Less Gas Fee per transaction as just simple transfers.
* DIRECT tBTC transfers (No need to convert to other supported tokens by tornado cash)

## How does the Dapp Work?
1. **Setup Account.**
![](https://i.imgur.com/nkqCFfv.png)
A random Public-Private Key Pair is generated. The Private key is encrypted by our password and gets stored into the browser's local storage.
Copy and Send the Public Key to the Sender.

2. **Send.**
![](https://i.imgur.com/RM38ykf.png)
Switch onto the send tab. You would see your tBTC balance. If it's zero then head over to https://dapp.test.tbtc.network/ to convert BTC to tBTC.
Input the Public Key of Receiver and enter any arbitary amount of tBTC you want to send (after approving the contract). Click "Send tBTC".

The sender uses the provided Public Key and Mulitplies it with a Random Number to generate a fresh Stealth Address. The tokens are transferred to this address and an Event is emitted by our Smart Contract containing this Random Number encrypted by the receiver Public Key ensuring that only the receiver can decrypt the Random Number from Event Logs history of the entire contract.

3. **Withdraw.**
![](https://i.imgur.com/q3dCmh2.png)
On entering the password, Private key is unlocked from browser's local storage. The Dapp checks to decrypt all the events emitted, using this Private Key. On successfully finding the corresponding event, we get the Random Number. Using this Random Number and our Private Key, the Private Key of Stealth Address is generated.

This generated Private Key can be directly imported into Metamask:

![](https://i.imgur.com/HrBXF3M.png)

And there you have your Tokens:

![](https://i.imgur.com/gYd0XP8.png)

## Transaction Overview for third party
In our transaction only the sender and receiver are aware of receiver's identity. For an outsider looking at the transaction, Umbra makes the link between sending and receiving address meaningless! Everyone knows the address funds were sent to, but they don't know who controls that address.

<div align="center">
	<img width="400" src="https://i.imgur.com/FmlBWoR.png" alt="Umbra Logo">
	<br />
	<sub><sup>
		Image via <a href="https://hackernoon.com/blockchain-privacy-enhancing-technology-series-stealth-address-i-c8a3eb4e4e43">@IoTeX hackernoon</a>.
	</sub></sup>
</div>

## What's in for the Future of PrivaSwap?
* To use tbtc.js to mint tBTC which get directly transferred to the Stealth Address via our Smart Contract.
* Integrate GSN to allow sending of tokens from Stealth Address to any other address.

## Setup the Project
1. Clone the repo
2. `npm i` and `npm run start`
3. Switch Metamask to Ropsten and head over to `localhost:3000`
