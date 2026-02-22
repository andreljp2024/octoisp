-- Add device/customer/pop references to network tools history
ALTER TABLE network_tool_runs
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pop_id UUID REFERENCES pops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS network_tool_runs_device_idx ON network_tool_runs(device_id);
CREATE INDEX IF NOT EXISTS network_tool_runs_customer_idx ON network_tool_runs(customer_id);
CREATE INDEX IF NOT EXISTS network_tool_runs_pop_idx ON network_tool_runs(pop_id);
