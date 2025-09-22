export interface IBreakpoint {
  isPhone: boolean,
  isTablet: boolean,
  isDesktop: boolean
}

const useBreakpoint = (): IBreakpoint => {
  const width = window.innerWidth

  if (width <= 600) {
    return { isPhone: true, isTablet: false, isDesktop: false }
  } else if (width <= 768) {
    return { isPhone: false, isTablet: true, isDesktop: false }
  } else {
    return { isPhone: false, isTablet: false, isDesktop: true }
  }
}

export default useBreakpoint
