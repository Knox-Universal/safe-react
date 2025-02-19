import { useCallback, useMemo } from 'react'

import { SafeApp } from '../../types'
import { useCustomSafeApps } from './useCustomSafeApps'
import { useRemoteSafeApps } from './useRemoteSafeApps'
import { usePinnedSafeApps } from './usePinnedSafeApps'
import { FETCH_STATUS } from 'src/utils/requests'
import { useAnalytics } from 'src/utils/googleAnalytics'

type UseAppListReturnType = {
  allApps: SafeApp[]
  appList: SafeApp[]
  customApps: SafeApp[]
  pinnedSafeApps: SafeApp[]
  togglePin: (app: SafeApp) => void
  removeApp: (appId: string) => void
  addCustomApp: (app: SafeApp) => void
  isLoading: boolean
}

type SafeAppsGAEvent = {
  category: 'Safe App'
  action: 'pin' | 'unpin'
}

const unPinAppGAEvent: SafeAppsGAEvent = {
  category: 'Safe App',
  action: 'unpin',
}

const pinAppGAEvent: SafeAppsGAEvent = {
  category: 'Safe App',
  action: 'pin',
}

const useAppList = (): UseAppListReturnType => {
  const { remoteSafeApps, status: remoteAppsFetchStatus } = useRemoteSafeApps()
  const { customSafeApps, updateCustomSafeApps } = useCustomSafeApps()
  const { pinnedSafeAppIds, updatePinnedSafeApps } = usePinnedSafeApps()
  const remoteIsLoading = remoteAppsFetchStatus === FETCH_STATUS.LOADING

  const { trackEvent } = useAnalytics()

  const allApps = useMemo(() => {
    const allApps = [...remoteSafeApps, ...customSafeApps]
    return allApps.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [remoteSafeApps, customSafeApps])

  const appList = useMemo(() => {
    return remoteSafeApps.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [remoteSafeApps])

  const customApps = useMemo(
    () =>
      // Filter out custom apps that are now part of the production app list
      customSafeApps
        .filter((persistedApp) => !remoteSafeApps.some((app) => app.url === persistedApp.url))
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [customSafeApps, remoteSafeApps],
  )

  const pinnedSafeApps = useMemo(
    () => appList.filter((app) => pinnedSafeAppIds.includes(app.id)),
    [pinnedSafeAppIds, appList],
  )

  const addCustomApp = useCallback(
    (app: SafeApp): void => {
      const newList = [...customSafeApps, app]
      updateCustomSafeApps(newList)
    },
    [updateCustomSafeApps, customSafeApps],
  )

  const removeApp = useCallback(
    (appId: string): void => {
      const newPersistedList = customSafeApps.filter(({ id }) => id !== appId)
      updateCustomSafeApps(newPersistedList)
    },
    [updateCustomSafeApps, customSafeApps],
  )

  const togglePin = useCallback(
    (app: SafeApp): void => {
      const { id: appId, name: appName } = app
      const newPinnedIds = [...pinnedSafeAppIds]
      const isAppPinned = pinnedSafeAppIds.includes(appId)

      if (isAppPinned) {
        trackEvent({ ...unPinAppGAEvent, label: appName })
        newPinnedIds.splice(newPinnedIds.indexOf(appId), 1)
      } else {
        trackEvent({ ...pinAppGAEvent, label: appName })
        newPinnedIds.push(appId)
      }

      updatePinnedSafeApps(newPinnedIds)
    },
    [trackEvent, updatePinnedSafeApps, pinnedSafeAppIds],
  )

  return {
    allApps,
    appList,
    customApps,
    pinnedSafeApps,
    removeApp,
    togglePin,
    addCustomApp,
    isLoading: remoteIsLoading,
  }
}

export { useAppList }
