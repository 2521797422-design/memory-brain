import { createContext, useContext, useMemo, useState } from 'react'
import { BRAIN_REGIONS } from '../config/brainRegions'

const BrainModelContext = createContext({
  ready: false,
  radius: 2.2,
  bounds: null,
  regions: BRAIN_REGIONS,
  setModel: () => {},
})

export function BrainModelProvider({ children }) {
  const [model, setModel] = useState({
    ready: false,
    radius: 2.2,
    bounds: null,
    regions: BRAIN_REGIONS,
  })

  const value = useMemo(
    () => ({
      ...model,
      setModel,
    }),
    [model],
  )

  return (
    <BrainModelContext.Provider value={value}>
      {children}
    </BrainModelContext.Provider>
  )
}

export function useBrainModel() {
  return useContext(BrainModelContext)
}
