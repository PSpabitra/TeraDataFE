import React from 'react'
import Field from '../../common/Field'

const AdfForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Tenant ID"
        value={values.tenant_id}
        onChange={v => onChange('tenant_id', v)}
        required
      />
      <Field
        label="Client ID"
        value={values.client_id}
        onChange={v => onChange('client_id', v)}
        required
      />
      <Field
        label="Client Secret"
        value={values.client_secret}
        onChange={v => onChange('client_secret', v)}
        password
        required
      />
      <Field
        label="Subscription ID"
        value={values.subscription_id}
        onChange={v => onChange('subscription_id', v)}
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field
          label="Resource Group Name"
          value={values.resource_group_name}
          onChange={v => onChange('resource_group_name', v)}
          required
        />
        <Field
          label="Factory Name"
          value={values.factory_name}
          onChange={v => onChange('factory_name', v)}
          required
        />
      </div>
    </>
  )
}

export default AdfForm
