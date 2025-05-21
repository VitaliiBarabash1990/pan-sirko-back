const parseContactType = (contactType) => {
  const isString = typeof contactType === 'string';
  if (!isString) return;
  const isContactType = (contactType) =>
    ['work', 'home', 'personal'].includes(contactType);

  if (isContactType(contactType)) return contactType;
};

// const parseIsFavourite = (isFavourite) => {
//   const isBoolean = typeof isFavourite === 'boolean';
//   if (!isBoolean) return;
//   return isFavourite;
// };

const parseIsFavourite = (IsFavourite) => {
  if (typeof IsFavourite === 'boolean') return IsFavourite;
  if (typeof IsFavourite === 'string') {
    if (IsFavourite.toLowerCase() === 'true') return true;
    if (IsFavourite.toLowerCase() === 'false') return false;
  }
  return;
};

export const parseFilterParams = (query) => {
  const { contactType, isFavourite } = query;

  const parsedContactType = parseContactType(contactType);
  const parsedIsFafourite = parseIsFavourite(isFavourite);

  return {
    contactType: parsedContactType,
    isFavourite: parsedIsFafourite,
  };
};
