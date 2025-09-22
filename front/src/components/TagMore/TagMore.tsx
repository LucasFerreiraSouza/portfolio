import { Tooltip } from 'antd'
import styles from './TagMore.module.scss'
import { ReactNode } from 'react'

function TagMore({ additionalNumber, tooltip }: { additionalNumber: number, tooltip?: ReactNode }) {
  return (
    <Tooltip title={tooltip}>
      <div className={styles.tagMore}>
        +{additionalNumber}
      </div>
    </Tooltip>
  )
}

export default TagMore