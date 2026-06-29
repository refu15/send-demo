"use client";

import { Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { RideImportResult, Staff, StaffRole, User, Vehicle } from "@/lib/ride/types";

type MasterManagementProps = {
  data: RideImportResult;
  onAddUser: (input: UserFormInput) => void;
  onAddVehicle: (input: VehicleFormInput) => void;
  onAddStaff: (input: StaffFormInput) => void;
  onUpdateUser: (id: string, input: UserFormInput) => void;
  onUpdateVehicle: (id: string, input: VehicleFormInput) => void;
  onUpdateStaff: (id: string, input: StaffFormInput) => void;
  onDeleteUser: (user: User) => void;
  onDeleteVehicle: (vehicle: Vehicle) => void;
  onDeleteStaff: (staff: Staff) => void;
};

export type UserFormInput = {
  name: string;
  gender?: string;
  servicePattern?: string;
  phone?: string;
  address?: string;
  wheelchairRequired: boolean;
  medicineCheckRequired: boolean;
  note?: string;
};

export type VehicleFormInput = { name: string; capacity?: number; note?: string };

export type StaffFormInput = { name: string; role: StaffRole; qualification?: string };

export function MasterManagement({
  data,
  onAddUser,
  onAddVehicle,
  onAddStaff,
  onUpdateUser,
  onUpdateVehicle,
  onUpdateStaff,
  onDeleteUser,
  onDeleteVehicle,
  onDeleteStaff,
}: MasterManagementProps) {
  return (
    <section className="section" aria-labelledby="masters-title">
      <div>
        <h2 id="masters-title">マスタ管理</h2>
        <p className="subtle">
          利用者・車両・職員をアプリ内で登録、編集、削除します。送迎計画で使用中のマスタは削除できません。
        </p>
      </div>

      <div className="grid two">
        <UserCreateForm onAddUser={onAddUser} />
        <div className="grid">
          <VehicleCreateForm onAddVehicle={onAddVehicle} />
          <StaffCreateForm onAddStaff={onAddStaff} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <h3>登録状況</h3>
          <div className="summary-row">
            <Metric label="利用者" value={data.users.length} />
            <Metric label="車両" value={data.vehicles.length} />
            <Metric label="職員" value={data.staff.length} />
            <Metric label="計画" value={data.ridePlans.length} />
            <Metric label="停車" value={data.rideStops.length} />
          </div>
        </div>
      </div>

      <MasterTables
        data={data}
        onUpdateUser={onUpdateUser}
        onUpdateVehicle={onUpdateVehicle}
        onUpdateStaff={onUpdateStaff}
        onDeleteUser={onDeleteUser}
        onDeleteVehicle={onDeleteVehicle}
        onDeleteStaff={onDeleteStaff}
      />
    </section>
  );
}

function UserCreateForm({ onAddUser }: { onAddUser: (input: UserFormInput) => void }) {
  return (
    <div className="panel">
      <form
        className="panel-body form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onAddUser(readUserForm(new FormData(form)));
          form.reset();
        }}
      >
        <h3>利用者を追加</h3>
        <label>
          氏名
          <input name="name" required placeholder="山田 花子" />
        </label>
        <div className="form-grid compact">
          <label>
            性別
            <input name="gender" placeholder="女性" />
          </label>
          <label>
            利用パターン
            <input name="servicePattern" placeholder="月・水・金" />
          </label>
        </div>
        <label>
          電話
          <input name="phone" inputMode="tel" placeholder="03-0000-0000" />
        </label>
        <label>
          住所
          <input name="address" placeholder="東京都..." />
        </label>
        <label>
          備考
          <textarea name="note" rows={3} placeholder="玄関で声かけ、薬確認など" />
        </label>
        <div className="check-row">
          <label>
            <input name="wheelchairRequired" type="checkbox" /> 車いす対応
          </label>
          <label>
            <input name="medicineCheckRequired" type="checkbox" /> 薬確認
          </label>
        </div>
        <button className="primary-button" type="submit">
          利用者を登録
        </button>
      </form>
    </div>
  );
}

function VehicleCreateForm({ onAddVehicle }: { onAddVehicle: (input: VehicleFormInput) => void }) {
  return (
    <div className="panel">
      <form
        className="panel-body form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onAddVehicle(readVehicleForm(new FormData(form)));
          form.reset();
        }}
      >
        <h3>車両を追加</h3>
        <label>
          車両名
          <input name="name" required placeholder="1号車" />
        </label>
        <label>
          定員
          <input name="capacity" min={1} type="number" placeholder="6" />
        </label>
        <label>
          備考
          <input name="note" placeholder="車いす対応など" />
        </label>
        <button className="primary-button" type="submit">
          車両を登録
        </button>
      </form>
    </div>
  );
}

function StaffCreateForm({ onAddStaff }: { onAddStaff: (input: StaffFormInput) => void }) {
  return (
    <div className="panel">
      <form
        className="panel-body form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onAddStaff(readStaffForm(new FormData(form)));
          form.reset();
        }}
      >
        <h3>職員を追加</h3>
        <label>
          氏名
          <input name="name" required placeholder="佐藤 太郎" />
        </label>
        <label>
          役割
          <StaffRoleSelect name="role" defaultValue="driver" />
        </label>
        <label>
          資格・補足
          <input name="qualification" placeholder="二種免許、初任者研修など" />
        </label>
        <button className="primary-button" type="submit">
          職員を登録
        </button>
      </form>
    </div>
  );
}

function MasterTables({
  data,
  onUpdateUser,
  onUpdateVehicle,
  onUpdateStaff,
  onDeleteUser,
  onDeleteVehicle,
  onDeleteStaff,
}: {
  data: RideImportResult;
  onUpdateUser: (id: string, input: UserFormInput) => void;
  onUpdateVehicle: (id: string, input: VehicleFormInput) => void;
  onUpdateStaff: (id: string, input: StaffFormInput) => void;
  onDeleteUser: (user: User) => void;
  onDeleteVehicle: (vehicle: Vehicle) => void;
  onDeleteStaff: (staff: Staff) => void;
}) {
  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-body">
          <h3>利用者一覧</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>電話</th>
                  <th>住所</th>
                  <th>確認</th>
                  <th>備考</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <UserEditRow
                    key={user.id}
                    user={user}
                    inUse={data.rideStops.some((stop) => stop.userId === user.id)}
                    onUpdate={onUpdateUser}
                    onDelete={onDeleteUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <div className="panel-body">
            <h3>車両一覧</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>車両名</th>
                    <th>定員</th>
                    <th>備考</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vehicles.map((vehicle) => (
                    <VehicleEditRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      inUse={data.ridePlans.some((plan) => plan.vehicleId === vehicle.id)}
                      onUpdate={onUpdateVehicle}
                      onDelete={onDeleteVehicle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-body">
            <h3>職員一覧</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>氏名</th>
                    <th>役割</th>
                    <th>資格・補足</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staff.map((staff) => (
                    <StaffEditRow
                      key={staff.id}
                      staff={staff}
                      inUse={data.ridePlans.some(
                        (plan) => plan.driverId === staff.id || plan.attendantId === staff.id,
                      )}
                      onUpdate={onUpdateStaff}
                      onDelete={onDeleteStaff}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserEditRow({
  user,
  inUse,
  onUpdate,
  onDelete,
}: {
  user: User;
  inUse: boolean;
  onUpdate: (id: string, input: UserFormInput) => void;
  onDelete: (user: User) => void;
}) {
  const [draft, setDraft] = useState<UserFormInput>({
    name: user.name,
    gender: user.gender,
    servicePattern: user.servicePattern,
    phone: user.phone,
    address: user.address,
    wheelchairRequired: user.wheelchairRequired,
    medicineCheckRequired: user.medicineCheckRequired,
    note: user.note,
  });

  return (
    <tr>
      <td>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </td>
      <td>
        <input value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
      </td>
      <td>
        <input
          value={draft.address ?? ""}
          onChange={(event) => setDraft({ ...draft, address: event.target.value })}
        />
      </td>
      <td>
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={draft.wheelchairRequired}
              onChange={(event) => setDraft({ ...draft, wheelchairRequired: event.target.checked })}
            />{" "}
            車いす
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.medicineCheckRequired}
              onChange={(event) => setDraft({ ...draft, medicineCheckRequired: event.target.checked })}
            />{" "}
            薬
          </label>
        </div>
      </td>
      <td>
        <input value={draft.note ?? ""} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
      </td>
      <td>
        <MasterActions
          inUse={inUse}
          onSave={() => onUpdate(user.id, draft)}
          onDelete={() => onDelete(user)}
        />
      </td>
    </tr>
  );
}

function VehicleEditRow({
  vehicle,
  inUse,
  onUpdate,
  onDelete,
}: {
  vehicle: Vehicle;
  inUse: boolean;
  onUpdate: (id: string, input: VehicleFormInput) => void;
  onDelete: (vehicle: Vehicle) => void;
}) {
  const [draft, setDraft] = useState<VehicleFormInput>({
    name: vehicle.name,
    capacity: vehicle.capacity,
    note: vehicle.note,
  });

  return (
    <tr>
      <td>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </td>
      <td>
        <input
          min={1}
          type="number"
          value={draft.capacity ?? ""}
          onChange={(event) =>
            setDraft({
              ...draft,
              capacity: event.target.value ? Number(event.target.value) : undefined,
            })
          }
        />
      </td>
      <td>
        <input value={draft.note ?? ""} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
      </td>
      <td>
        <MasterActions
          inUse={inUse}
          onSave={() => onUpdate(vehicle.id, draft)}
          onDelete={() => onDelete(vehicle)}
        />
      </td>
    </tr>
  );
}

function StaffEditRow({
  staff,
  inUse,
  onUpdate,
  onDelete,
}: {
  staff: Staff;
  inUse: boolean;
  onUpdate: (id: string, input: StaffFormInput) => void;
  onDelete: (staff: Staff) => void;
}) {
  const [draft, setDraft] = useState<StaffFormInput>({
    name: staff.name,
    role: staff.role,
    qualification: staff.qualification,
  });

  return (
    <tr>
      <td>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </td>
      <td>
        <StaffRoleSelect
          value={draft.role}
          onChange={(role) => setDraft({ ...draft, role })}
        />
      </td>
      <td>
        <input
          value={draft.qualification ?? ""}
          onChange={(event) => setDraft({ ...draft, qualification: event.target.value })}
        />
      </td>
      <td>
        <MasterActions
          inUse={inUse}
          onSave={() => onUpdate(staff.id, draft)}
          onDelete={() => onDelete(staff)}
        />
      </td>
    </tr>
  );
}

function StaffRoleSelect({
  name,
  value,
  defaultValue,
  onChange,
}: {
  name?: string;
  value?: StaffRole;
  defaultValue?: StaffRole;
  onChange?: (role: StaffRole) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={value ? undefined : defaultValue}
      onChange={(event) => onChange?.(event.target.value as StaffRole)}
    >
      <option value="driver">ドライバー</option>
      <option value="attendant">添乗</option>
      <option value="care">介護職</option>
      <option value="nurse">看護師</option>
      <option value="manager">管理者</option>
    </select>
  );
}

function MasterActions({
  inUse,
  onSave,
  onDelete,
}: {
  inUse: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="table-actions">
      <button className="secondary-button" type="button" onClick={onSave}>
        <Save size={14} /> 保存
      </button>
      <button
        className="danger-button"
        type="button"
        disabled={inUse}
        title={inUse ? "送迎計画または停車で使用中のため削除できません" : undefined}
        onClick={onDelete}
      >
        <Trash2 size={14} /> 削除
      </button>
    </div>
  );
}

function readUserForm(formData: FormData): UserFormInput {
  return {
    name: String(formData.get("name") ?? ""),
    gender: optionalText(formData, "gender"),
    servicePattern: optionalText(formData, "servicePattern"),
    phone: optionalText(formData, "phone"),
    address: optionalText(formData, "address"),
    wheelchairRequired: formData.get("wheelchairRequired") === "on",
    medicineCheckRequired: formData.get("medicineCheckRequired") === "on",
    note: optionalText(formData, "note"),
  };
}

function readVehicleForm(formData: FormData): VehicleFormInput {
  const capacity = Number(formData.get("capacity"));
  return {
    name: String(formData.get("name") ?? ""),
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : undefined,
    note: optionalText(formData, "note"),
  };
}

function readStaffForm(formData: FormData): StaffFormInput {
  return {
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "driver") as StaffRole,
    qualification: optionalText(formData, "qualification"),
  };
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span className="subtle">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
