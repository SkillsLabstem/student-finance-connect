export function populateDepartmentSelector(departments, selector) {
  selector.innerHTML = departments.map((department) => `<option value="${department.id}">${department.name}</option>`).join('');
  selector.value = departments.some((department) => department.id === 'general') ? 'general' : departments[0]?.id || '';
}

export function renderDepartmentForms(data, selectedId, esc, formRow) {
  const department = data.formDepartments.find((item) => item.id === selectedId);
  const forms = data.forms.filter((form) => form.directoryDepartmentId === selectedId && form.id !== 'general-request');
  const list = document.getElementById('formsGrid');
  if (!department || !forms.length) {
    list.innerHTML = `<p class="empty">No forms are currently assigned to ${esc(department?.name || 'this department')}.</p>`;
    return;
  }
  list.innerHTML = forms.map((form) => formRow(form)).join('');
}
