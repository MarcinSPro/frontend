import React, {useEffect, useState} from "react";
import {Modal} from "../../atoms/Modal";
import {x} from "@xstyled/styled-components"
import {BsFillCheckCircleFill} from "react-icons/all";
import {Link} from "react-router-dom";
import styled from '@xstyled/styled-components'
import axios from "axios";

export const marketQueryParam = "market"
export const networkQueryParam = "network"
export const mainnetChainName = "zksync"
export const rinkebyChainName = "zksync-rinkeby"
export const getMarketChainFromId = (chainId) => {
  if (chainId === 1) {
    return mainnetChainName
  } else if (chainId === 1000) {
    return rinkebyChainName
  } else {
    return null
  }
}
export const getChainIdFromMarketChain = (chainName) => {
  if (chainName === mainnetChainName) {
    return 1
  } else if (chainName === rinkebyChainName) {
    return 1000
  } else {
    return null
  }
}

const StyledLink = styled(Link)`
  color: blue-gray-400;
  fontSize: 16;
  &:hover {
    color: blue-100;
  }
`

const SuccessModal = ({txid, show, onClose}) => {
  // test tx
  // {"arweave_txid":"-C60-kmz6VjDiWv_MsKzLXqNA_vC7c29sdaasOInaj8","remaining_bytes":499610}

  const [pairNetwork, setPairNetwork] = useState()
  const [baseAsset, setBaseAsset] = useState()
  const [quoteAsset, setQuoteAsset] = useState()
  const [alias, setAlias] = useState()

  const viewMarketURL = `https://zigzag-markets.herokuapp.com/markets?id=${txid}`

  useEffect(() => {
    axios.get(viewMarketURL).then(res => {
      const data = res.data[0]
      setAlias(data.alias)
      setBaseAsset(data.baseAsset.symbol)
      setQuoteAsset(data.quoteAsset.symbol)

      const chainId = Number(data.zigzagChainId)
      setPairNetwork(getMarketChainFromId(chainId))
    }).catch(err => console.error(err))
  }, [])

  return <Modal show={show} onClose={onClose}>
    <x.div mb={3} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
      <BsFillCheckCircleFill size={55} color={"teal-200"}/>
      <x.div mb={3} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"}>
        <x.div fontSize={32}>
          Market Listed
        </x.div>
        <x.div fontSize={18} color={"blue-gray-500"}>
          {alias} on {pairNetwork}
        </x.div>
      </x.div>
    </x.div>
    <x.div w={"full"} display={"flex"} flexDirection={"column"} alignItems={"center"} mb={6} fontSize={14}>
      <x.a href={viewMarketURL} target={"_blank"} mb={2} color={{_: "blue-gray-400", hover: "blue-100"}}>
        View your market
      </x.a>
      <StyledLink
        to={{
          pathname: '/',
          search: `?${marketQueryParam}=${baseAsset}-${quoteAsset}&${networkQueryParam}=${pairNetwork}`
        }}
      >
        Trade your market
      </StyledLink>
    </x.div>
    <x.div fontSize={12} textAlign={"center"} color={"blue-gray-600"} mb={3}>
      arweave tx: {txid}
    </x.div>
  </Modal>
}


export default SuccessModal;
