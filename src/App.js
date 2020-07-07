import React, { useState, useEffect } from 'react';
import { grommet, Box, Button, Heading, Grommet, Tabs, Tab } from 'grommet';

import Web3 from "web3";
const ethers = require('ethers')
const ERC20abi = require('./contracts/ERC20.json')
const tbtcAddress = "0x157052025506210A1c3696fbb4009849d0c30D1F"
const tbtcUmbraAbi = require("./contracts/tbtcUmbra.json")
const tbtcUmbraAddress = "0xb9b3c8B866B8Dd7A3102c0b6565886b08bC40DcA"

const passworder = require('browser-passworder');
const umbra = require('umbra-js');
const { RandomNumber, KeyPair } = umbra

let web3
const setupWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try { 
      await window.ethereum.enable()
      // User has allowed account access to DApp...
      web3.eth.defaultAccount = window.web3.eth.defaultAccount
      web3.eth.net.getNetworkType()
        .then(network => {
          if(network !== "ropsten")
            alert("Please Switch to Ropsten to use this DApp")
        });
    } catch(e) {
      // User has denied account access to DApp...
    }
  }
  // Legacy DApp Browsers
  else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
    web3.eth.net.getNetworkType()
      .then(network => {
        if(network !== "ropsten")
          alert("Please Switch to Ropsten to use this DApp")
      });
  }
  // Non-DApp Browsers
  else {
    alert('You have to install MetaMask !');
  }
}

async function encryptPrivateKey(password, dataToEncrypt) {
  const encrypted = await passworder.encrypt(password, dataToEncrypt);
  return encrypted;
}

async function decryptPrivateKey(password, dataToDecrypt) {
  const decrypted = await passworder.decrypt(password, dataToDecrypt);
  return decrypted;
}

function App() {
    const [pubKey, setPubKey] = useState("");
    const [password, setPassword] = useState("")
    const [withdrawPassword, setWithdrawPassword] = useState("")
    const [withdrawPrivateKey, setWithdrawPrivateKey] = useState([])
    const [tBtcAmt, setTBtcAmt] = useState()
    const [umbraData, setUmbraData] = useState(window.localStorage.getItem('umbra-data'))
    const [mainBal, setMainBal] = useState(0)
    const [tbtcTokenContract, setTbtcTokenContract] = useState()
    const [tbtcUmbra, setTbtcUmbra] = useState()
    const [withdrawBtnPressed, setwithdrawBtnPressed] = useState(false)
    const [pendingTxn, setPendingTxn] = useState(false)

    var tbtcToken

    useEffect(() => {
      async function contractsSetup() {
        setupWeb3()
        tbtcToken = new web3.eth.Contract(ERC20abi, tbtcAddress)
        var bal = await tbtcToken.methods.balanceOf(window.web3.eth.defaultAccount).call()
        bal = bal/(10**18)
        setMainBal(bal)
        setTbtcUmbra(new web3.eth.Contract(tbtcUmbraAbi, tbtcUmbraAddress))
        setTbtcTokenContract(tbtcToken)
      }
      contractsSetup()
    },[])

    var wallet, randomNumber, stealthFromPublic;

    const setup = async () => {
      // Generate a random wallet to simulate the recipient keys
      wallet = ethers.Wallet.createRandom()
      setPubKey(wallet.publicKey)
      // Encrypt private key and corresponding web3 wallet
      const data = {
        privateKey: wallet.privateKey, // randomly generated private key
        expectedWeb3Address: web3.eth.defaultAccount, // web3 wallet user is logged in with
      };

      const encrypted = await encryptPrivateKey(password, data);

      // Save to localStorage, read from localStorage, and decrypt to confirm everything worked
      window.localStorage.setItem('umbra-data', encrypted);
      setUmbraData(encrypted)
      const localStorageData = window.localStorage.getItem('umbra-data');
      const decrypted = await decryptPrivateKey(password, localStorageData);
      setPassword("")

      const isPrivateKeyEqual = data.privateKey === decrypted.privateKey;
      const isExpectedWeb3AddressEqual = data.expectedWeb3Address === decrypted.expectedWeb3Address;
      const wasSuccessful = isPrivateKeyEqual && isExpectedWeb3AddressEqual;

      if (!wasSuccessful) {
        throw new Error('Something went wrong during account setup. Please refresh the page and try again.');
      }
    }

    const sendFunds = async () => {
      // Get a random 32-byte number
      randomNumber = new RandomNumber()

      // Generate a KeyPair instance from recipient's public key
      const recipientFromPublic = new KeyPair(pubKey);

      // Encrypt the Random Number
      const encrypted = await recipientFromPublic.encrypt(randomNumber)

      const {
        iv, ephemeralPublicKey, ciphertext, mac,
      } = encrypted;
      console.log("Encrypted", encrypted)
      // Get x,y coordinates of ephemeral private key
      const ephemeralPublicKeyCoords = (new KeyPair(ephemeralPublicKey)).publicKeyHexCoords;
      // Break cipher text into three 32-byte components
      const ciphertextSlim = ciphertext.slice(2); // strip 0x prefix
      const ciphertextParts = {
        part1: `0x${ciphertextSlim.slice(0, 64)}`,
        part2: `0x${ciphertextSlim.slice(64, 128)}`,
        part3: `0x${ciphertextSlim.slice(128)}`,
      };
      const eventData = {
        iv,
        "pkx": ephemeralPublicKeyCoords.x,
        "pky": ephemeralPublicKeyCoords.y,
        "ct0": ciphertextParts.part1,
        "ct1": ciphertextParts.part2,
        "ct2": ciphertextParts.part3,
        mac
      }

      // Multiply public key by the random number to get a new KeyPair instance
      stealthFromPublic = recipientFromPublic.mulPublicKey(randomNumber)

      // Send fund's to the recipient's stealth receiving address
      console.log('Stealth recipient address: ', stealthFromPublic.address);

      await tbtcTokenContract.methods.approve(tbtcUmbraAddress, web3.utils.toWei(tBtcAmt, 'ether'))
              .send({ from: web3.eth.defaultAccount})
      //Call Transfer fx on tBTC ERC20 contract + Emit Event of encrypted
      await tbtcUmbra.methods.transferTBTC(
        stealthFromPublic.address,
        web3.utils.toWei(tBtcAmt, 'ether'),
        iv,
        ephemeralPublicKeyCoords.x,
        ephemeralPublicKeyCoords.y,
        ciphertextParts.part1,
        ciphertextParts.part2,
        ciphertextParts.part3,
        mac
      ).send({ from: web3.eth.defaultAccount, value: web3.utils.toWei("0.0001", 'ether')})
    }

    const receiveFunds = async () => {
      const localStorageData = window.localStorage.getItem('umbra-data');
      var decrypted;
      try{
        decrypted = await decryptPrivateKey(withdrawPassword, localStorageData);

        // Generate a KeyPair instance based on their own private key
        const recipientFromPrivate = new KeyPair(decrypted.privateKey);

        // Get Random Number from Events + Decrypt it
        const events=[]
        tbtcUmbra.getPastEvents(
                    'sendTBTC', 
                    { fromBlock: 8246584, toBlock: 'latest' }
        ).then(async (events) => {
          console.log("EVENTS: ", events)

          // clearing to prevent multiple renders if button pressed more than once
          setWithdrawPrivateKey([])

          for(var i=0; i < events.length; i++) {
            try {
              const {
                iv, pkx, pky, ct0, ct1, ct2, mac
              } = events[i].returnValues
              // Attempt decryption
              const payload = {
                iv,
                ephemeralPublicKey: `0x04${pkx.slice(2)}${pky.slice(2)}`,
                ciphertext: `0x${ct0.slice(2)}${ct1.slice(2)}${ct2.slice(2)}`,
                mac,
              };
      
              const plaintext = await recipientFromPrivate.decrypt(payload)
              const prefix = 'umbra-protocol-v0';
              const randomNumber = plaintext.slice(prefix.length)
      
              // Multiply their private key by the random number to get a new KeyPair instance
              const stealthFromPrivate = recipientFromPrivate.mulPrivateKey(randomNumber);
      
              // display tbtc balance of this address
              const bal = web3.utils.fromWei(await tbtcTokenContract.methods.balanceOf(stealthFromPrivate.address).call(), 'ether')
              const ethBal = web3.utils.fromWei(await web3.eth.getBalance(stealthFromPrivate.address), 'ether')
      
              setWithdrawPrivateKey([...withdrawPrivateKey, {bal, ethBal, pk: stealthFromPrivate.privateKeyHex}])
            } catch (err) {
              // Announcement not for user, so ignore it
            }
            setwithdrawBtnPressed(true)
          }
        })

      } catch (err) {
        alert(err)
      }
    }

    return (
    <Grommet theme={grommet} full>
      <AppBar>
        <Heading level='1' style={{margin: "20px auto", letterSpacing:"5px"}}>PrivaSwap</Heading>
        <Heading level='6' style={{margin: "0 auto"}}>| Powered by Umbra Protocol</Heading>
      </AppBar>
      <Tabs style={{paddingTop: "30px", maxWidth:"75%", margin:"auto"}}>
        <Tab title="SETUP ACCOUNT">
          <Box pad="medium">
          <Heading level='3'>SETUP ACCOUNT</Heading>
            <input style={{fontSize: "1.5rem", borderRadius:"10px", padding: "15px"}} placeholder="Enter Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button style={{padding: "18px", marginTop:"7px"}} primary label="Create Account" onClick={()=>setup()}/>
              {
                pubKey && (`Public Key is: ${pubKey}`)
              }
          </Box>
        </Tab>
        <Tab title="SEND">
          <Box pad="medium">
            <Heading level='4'>Your tBTC Balance: {mainBal}</Heading>
            Convert BTC to tBTC here: <a href="https://dapp.test.tbtc.network/">https://dapp.test.tbtc.network/</a>
            <Heading level='3'>SEND:</Heading>
            <input style={{fontSize: "1.2rem", borderRadius:"10px", padding: "15px"}} placeholder="Enter Receiver's Public Key" type="text" value={pubKey} onChange={e => setPubKey(e.target.value)} />
            <input style={{fontSize: "1.2rem", borderRadius:"10px", padding: "15px", marginTop:"5px"}} placeholder="Enter tBTC Amount" type="number" value={tBtcAmt} onChange={e => setTBtcAmt(e.target.value)} />
            <Button style={{padding: "18px", marginTop:"7px"}} primary label="Send tBTC" onClick={()=>sendFunds()}/>
          </Box>
        </Tab>
        <Tab title="WITHDRAW">
          <Box pad="medium">
            <Heading level='3'>WITHDRAW</Heading>
            {
              !(umbraData) && "Please Setup Account First"
            }
            {
              (umbraData) && (
                <>
                  <input style={{fontSize: "1.2rem", borderRadius:"10px", padding: "15px"}} placeholder="Enter Password" type="password" value={withdrawPassword} onChange={e => setWithdrawPassword(e.target.value)} />
                  <Button style={{padding: "18px", marginTop:"7px"}} primary label="Withdraw tBTC" onClick={()=>receiveFunds()}/>
                  <br />
                  {
                    (withdrawPrivateKey.length > 0) ? (
                      <>
                        {
                          withdrawPrivateKey.map(pk => (
                            <>
                              <b>Balance:</b> {pk.bal} tBTC + {pk.ethBal} ETH <br />
                              <b>Private Key:</b> {pk.pk}
                              <br /><br />
                            </>
                          ))
                        }
                      </>
                    ) : ((withdrawBtnPressed) ? "No Payments received on Stealth Address" : "")
                  }
                </>
              )
            }
          </Box>
        </Tab>
      </Tabs>
    </Grommet>
  );
}

const AppBar = (props) => (
    <Box
      tag='header'
      direction='row'
      align='center'
      justify='between'
      background='brand'
      pad={{ left: 'medium', right: 'small', vertical: 'small' }}
      elevation='medium'
      style={{ zIndex: '1' }}
      {...props}
    />
);

export default App;

// TODO integrate tbtc.js
// import TBTC from './tbtc.js/TBTC.js'
// import TBTC from '@keep-network/tbtc.js'

// async function test() {
//   const tbtc = await TBTC.withConfig({
//     web3: web3,
//     bitcoinNetwork: "testnet",
//     electrum: {
//       testnet: {
//         server: "electrumx-server.test.tbtc.network",
//         port: 50002,
//         protocol: "ssl"
//       },
//       testnetPublic: {
//         server: "testnet1.bauerj.eu",
//         port: 50002,
//         protocol: "ssl"
//       },
//       testnetWS: {
//         server: "electrumx-server.test.tbtc.network",
//         port: 8443,
//         protocol: "wss"
//       }
//     }
//   })

//   const lotSizes = await tbtc.Deposit.availableSatoshiLotSizes()

//   console.log("Initiating deposit...")
//   const deposit = await tbtc.Deposit.withSatoshiLotSize(lotSizes[0])
//   deposit.autoSubmit()
//   deposit.onBitcoinAddressAvailable(async address => {
//     const lotSize = await deposit.getSatoshiLotSize()
//     console.log(
//       "\tGot deposit address:",
//       address,
//       "; fund with:",
//       lotSize.toString(),
//       "satoshis please."
//     )
//     console.log("Now monitoring for deposit transaction...")
//   })

//   return await new Promise((resolve, reject) => {
//     console.log("Waiting for active deposit...")
//     try {
//       deposit.onActive(async () => {
//         try {
//           console.log("Deposit is active, minting...")
//           const tbtc = await deposit.mintTBTC()
//           console.log(`Minted ${tbtc} TBTC!`)
//           // or
//           // (await deposit.getTDT()).transfer(someLuckyContract)
//         } catch (error) {
//           reject(error)
//         }
//       })
//     } catch (error) {
//       reject(error)
//     }
//   })
// }

// test()
//   .then(() => {
//     console.log("All done!")
//   })
//   .catch(error => {
//     console.error("Boom boom time", error)
//   })