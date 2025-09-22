import { Table as AntTable, TableProps } from 'antd'
import styles from './Table.module.scss'

function Table<T extends { id?: string; _id?: string; GUID?: string }>(props: {
  columns: TableProps<T>['columns']
  data: T[]
  canUseScroll?: boolean
  loading?: boolean
}) {
  return (
    <AntTable
      rowKey={(record) => record.GUID || record._id || record.id || ''}
      columns={props.columns}
      dataSource={props.data}
      loading={props.loading}
      className={styles.table}
      scroll={{ x: 'max-content' }}
      pagination={{
        total: props.data.length,
        defaultCurrent: 1,
        defaultPageSize: 8,
        showSizeChanger: false
      }}
    />
  )
}

export default Table
